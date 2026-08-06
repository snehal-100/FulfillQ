package com.fulfilliq.service;

import com.fulfilliq.model.Shipment;
import com.fulfilliq.model.ShipmentStatus;
import com.fulfilliq.repository.ShipmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ShippingService {

    private final ShipmentRepository shipmentRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final List<String> COURIERS = List.of("FedEx", "DHL Express", "UPS", "BlueDart");

    public ShippingService(ShipmentRepository shipmentRepository,
                           KafkaTemplate<String, String> kafkaTemplate,
                           ObjectMapper objectMapper) {
        this.shipmentRepository = shipmentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Shipment> getShipmentsByOrderId(Long orderId) {
        return shipmentRepository.findByOrderId(orderId);
    }

    public List<Shipment> getShipmentsByWarehouseId(Long warehouseId) {
        return shipmentRepository.findByWarehouseId(warehouseId);
    }

    @Transactional
    public Shipment createShipment(Long orderId, Long warehouseId) {
        String trackingNumber = "FIQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Pick a pseudo-random courier based on warehouseId
        String courier = COURIERS.get((int) (warehouseId % COURIERS.size()));

        Shipment shipment = new Shipment(orderId, warehouseId, trackingNumber, courier, ShipmentStatus.PACKED);
        Shipment savedShipment = shipmentRepository.save(shipment);

        publishEvent("shipment-created", Map.of(
            "shipmentId", savedShipment.getId(),
            "orderId", orderId,
            "warehouseId", warehouseId,
            "trackingNumber", trackingNumber,
            "courier", courier,
            "status", savedShipment.getStatus().name()
        ));

        return savedShipment;
    }

    @Transactional
    public Shipment updateStatus(Long shipmentId, ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found with id: " + shipmentId));

        shipment.setStatus(status);
        shipment.setUpdatedAt(LocalDateTime.now());
        Shipment savedShipment = shipmentRepository.save(shipment);

        if (status == ShipmentStatus.DELIVERED) {
            publishEvent("shipment-delivered", Map.of(
                "shipmentId", savedShipment.getId(),
                "orderId", savedShipment.getOrderId(),
                "status", savedShipment.getStatus().name()
            ));
        } else {
            publishEvent("notification-events", Map.of(
                "shipmentId", savedShipment.getId(),
                "orderId", savedShipment.getOrderId(),
                "status", savedShipment.getStatus().name(),
                "message", "Shipment state updated to: " + status.name()
            ));
        }

        return savedShipment;
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
