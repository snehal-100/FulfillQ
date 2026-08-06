package com.fulfilliq.service;

import com.fulfilliq.model.InventoryLog;
import com.fulfilliq.model.WarehouseInventory;
import com.fulfilliq.repository.InventoryLogRepository;
import com.fulfilliq.repository.WarehouseInventoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InventoryService {

    private final WarehouseInventoryRepository inventoryRepository;
    private final InventoryLogRepository logRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public InventoryService(WarehouseInventoryRepository inventoryRepository,
                            InventoryLogRepository logRepository,
                            KafkaTemplate<String, String> kafkaTemplate,
                            ObjectMapper objectMapper) {
        this.inventoryRepository = inventoryRepository;
        this.logRepository = logRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Cacheable(value = "productStock", key = "#productId")
    public List<WarehouseInventory> getStockForProduct(Long productId) {
        return inventoryRepository.findByProductId(productId);
    }

    public List<WarehouseInventory> getStockForWarehouse(Long warehouseId) {
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    @Transactional
    @CacheEvict(value = "productStock", key = "#productId")
    public void addStock(Long warehouseId, Long productId, int quantity, String reason) {
        Optional<WarehouseInventory> existingOpt = inventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId);
        WarehouseInventory inventory;
        if (existingOpt.isPresent()) {
            inventory = existingOpt.get();
            inventory.setAvailableStock(inventory.getAvailableStock() + quantity);
        } else {
            inventory = new WarehouseInventory(warehouseId, productId, quantity, 0);
        }
        inventoryRepository.save(inventory);
        logRepository.save(new InventoryLog(warehouseId, productId, quantity, reason));
        
        publishEvent("inventory-updated", Map.of(
            "warehouseId", warehouseId,
            "productId", productId,
            "change", quantity,
            "reason", reason
        ));
    }

    @Transactional
    @CacheEvict(value = "productStock", key = "#productId")
    public boolean reserveStock(Long warehouseId, Long productId, int quantity, Long orderId) {
        WarehouseInventory inventory = inventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new IllegalArgumentException("No inventory record found for product: " + productId + " at warehouse: " + warehouseId));

        if (inventory.getAvailableStock() < quantity) {
            return false;
        }

        inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
        inventory.setReservedStock(inventory.getReservedStock() + quantity);
        inventoryRepository.save(inventory);

        logRepository.save(new InventoryLog(warehouseId, productId, -quantity, "RESERVED_FOR_ORDER_" + orderId));

        publishEvent("inventory-reserved", Map.of(
            "orderId", orderId,
            "warehouseId", warehouseId,
            "productId", productId,
            "quantity", quantity
        ));

        return true;
    }

    @Transactional
    @CacheEvict(value = "productStock", key = "#productId")
    public void releaseStock(Long warehouseId, Long productId, int quantity, Long orderId) {
        WarehouseInventory inventory = inventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new IllegalArgumentException("No inventory record found for product: " + productId + " at warehouse: " + warehouseId));

        inventory.setAvailableStock(inventory.getAvailableStock() + quantity);
        int reserved = inventory.getReservedStock() - quantity;
        inventory.setReservedStock(Math.max(0, reserved));
        inventoryRepository.save(inventory);

        logRepository.save(new InventoryLog(warehouseId, productId, quantity, "RELEASED_FROM_ORDER_" + orderId));

        publishEvent("inventory-released", Map.of(
            "orderId", orderId,
            "warehouseId", warehouseId,
            "productId", productId,
            "quantity", quantity
        ));
    }

    @Transactional
    @CacheEvict(value = "productStock", key = "#productId")
    public void confirmSale(Long warehouseId, Long productId, int quantity, Long orderId) {
        WarehouseInventory inventory = inventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, productId)
                .orElseThrow(() -> new IllegalArgumentException("No inventory record found for product: " + productId + " at warehouse: " + warehouseId));

        int reserved = inventory.getReservedStock() - quantity;
        inventory.setReservedStock(Math.max(0, reserved));
        inventoryRepository.save(inventory);

        logRepository.save(new InventoryLog(warehouseId, productId, 0, "SALE_CONFIRMED_ORDER_" + orderId));

        publishEvent("inventory-updated", Map.of(
            "orderId", orderId,
            "warehouseId", warehouseId,
            "productId", productId,
            "soldQuantity", quantity
        ));
    }

    private void publishEvent(String topic, Map<String, Object> data) {
        try {
            String message = objectMapper.writeValueAsString(data);
            kafkaTemplate.send(topic, message);
        } catch (Exception e) {
            System.err.println("Failed to publish event to topic: " + topic + ". Error: " + e.getMessage());
        }
    }
}
