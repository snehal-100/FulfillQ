package com.fulfilliq.controller;

import com.fulfilliq.model.InventoryTransfer;
import com.fulfilliq.model.TransferStatus;
import com.fulfilliq.service.InventoryTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/transfers")
public class InventoryTransferController {

    private final InventoryTransferService transferService;

    public InventoryTransferController(InventoryTransferService transferService) {
        this.transferService = transferService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryTransfer>> getAllTransfers() {
        return ResponseEntity.ok(transferService.getAllTransfers());
    }

    @GetMapping("/warehouse/{whId}")
    public ResponseEntity<List<InventoryTransfer>> getTransfersForWarehouse(@PathVariable Long whId) {
        return ResponseEntity.ok(transferService.getTransfersForWarehouse(whId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransferById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(transferService.getTransferById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTransfer(@RequestBody CreateTransferRequest request) {
        try {
            InventoryTransfer transfer = transferService.createTransfer(
                    request.getFromWarehouseId(),
                    request.getToWarehouseId(),
                    request.getItems()
            );
            return ResponseEntity.ok(transfer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            TransferStatus status = TransferStatus.valueOf(body.get("status").toUpperCase());
            InventoryTransfer transfer = transferService.updateStatus(id, status);
            return ResponseEntity.ok(transfer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    public static class CreateTransferRequest {
        private Long fromWarehouseId;
        private Long toWarehouseId;
        private List<InventoryTransferService.ItemRequest> items;

        public CreateTransferRequest() {}

        public Long getFromWarehouseId() { return fromWarehouseId; }
        public void setFromWarehouseId(Long fromWarehouseId) { this.fromWarehouseId = fromWarehouseId; }

        public Long getToWarehouseId() { return toWarehouseId; }
        public void setToWarehouseId(Long toWarehouseId) { this.toWarehouseId = toWarehouseId; }

        public List<InventoryTransferService.ItemRequest> getItems() { return items; }
        public void setItems(List<InventoryTransferService.ItemRequest> items) { this.items = items; }
    }
}
