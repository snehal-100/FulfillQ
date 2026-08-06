package com.fulfilliq.warehouse.controller;

import com.fulfilliq.warehouse.dto.WarehouseDistanceResponse;
import com.fulfilliq.warehouse.model.Warehouse;
import com.fulfilliq.warehouse.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWarehouseById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(warehouseService.getWarehouseById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(warehouseService.createWarehouse(warehouse));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) {
        try {
            return ResponseEntity.ok(warehouseService.updateWarehouse(id, warehouse));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWarehouse(@PathVariable Long id) {
        try {
            warehouseService.deleteWarehouse(id);
            return ResponseEntity.ok(Map.of("message", "Warehouse deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<WarehouseDistanceResponse>> getNearestWarehouses(
            @RequestParam double lat,
            @RequestParam double lon) {
        return ResponseEntity.ok(warehouseService.getWarehousesSortedByProximity(lat, lon));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<?> getWarehouseByManagerId(@PathVariable Long managerId) {
        try {
            return ResponseEntity.ok(warehouseService.getWarehouseByManagerId(managerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
