package com.fulfilliq.controller;

import com.fulfilliq.model.WarehouseInventory;
import com.fulfilliq.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final com.fulfilliq.repository.ProductRepository productRepository;

    public InventoryController(InventoryService inventoryService, com.fulfilliq.repository.ProductRepository productRepository) {
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
    }

    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody com.fulfilliq.model.Product product) {
        return ResponseEntity.ok(productRepository.save(product));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<WarehouseInventory>> getStockForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStockForProduct(productId));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<WarehouseInventory>> getStockForWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(inventoryService.getStockForWarehouse(warehouseId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addStock(@RequestBody Map<String, Object> body) {
        try {
            Long warehouseId = Long.valueOf(body.get("warehouseId").toString());
            Long productId = Long.valueOf(body.get("productId").toString());
            int quantity = Integer.parseInt(body.get("quantity").toString());
            String reason = body.getOrDefault("reason", "REST_API_ADD").toString();

            inventoryService.addStock(warehouseId, productId, quantity, reason);
            return ResponseEntity.ok(Map.of("message", "Stock added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reserve")
    public ResponseEntity<?> reserveStock(@RequestBody Map<String, Object> body) {
        try {
            Long warehouseId = Long.valueOf(body.get("warehouseId").toString());
            Long productId = Long.valueOf(body.get("productId").toString());
            int quantity = Integer.parseInt(body.get("quantity").toString());
            Long orderId = Long.valueOf(body.get("orderId").toString());

            boolean reserved = inventoryService.reserveStock(warehouseId, productId, quantity, orderId);
            if (reserved) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Stock reserved successfully"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Insufficient stock"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/release")
    public ResponseEntity<?> releaseStock(@RequestBody Map<String, Object> body) {
        try {
            Long warehouseId = Long.valueOf(body.get("warehouseId").toString());
            Long productId = Long.valueOf(body.get("productId").toString());
            int quantity = Integer.parseInt(body.get("quantity").toString());
            Long orderId = Long.valueOf(body.get("orderId").toString());

            inventoryService.releaseStock(warehouseId, productId, quantity, orderId);
            return ResponseEntity.ok(Map.of("message", "Stock released successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmSale(@RequestBody Map<String, Object> body) {
        try {
            Long warehouseId = Long.valueOf(body.get("warehouseId").toString());
            Long productId = Long.valueOf(body.get("productId").toString());
            int quantity = Integer.parseInt(body.get("quantity").toString());
            Long orderId = Long.valueOf(body.get("orderId").toString());

            inventoryService.confirmSale(warehouseId, productId, quantity, orderId);
            return ResponseEntity.ok(Map.of("message", "Sale confirmed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
