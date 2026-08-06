package com.fulfilliq.controller;

import com.fulfilliq.model.Shipment;
import com.fulfilliq.model.ShipmentStatus;
import com.fulfilliq.service.ShippingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Shipment>> getShipmentsByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(shippingService.getShipmentsByOrderId(orderId));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<Shipment>> getShipmentsByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(shippingService.getShipmentsByWarehouseId(warehouseId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateShipmentStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            ShipmentStatus status = ShipmentStatus.valueOf(body.get("status"));
            Shipment shipment = shippingService.updateStatus(id, status);
            return ResponseEntity.ok(shipment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value or " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
