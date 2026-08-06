package com.fulfilliq.service;

import com.fulfilliq.model.InventoryLog;
import com.fulfilliq.model.InventoryTransfer;
import com.fulfilliq.model.TransferItem;
import com.fulfilliq.model.TransferStatus;
import com.fulfilliq.model.WarehouseInventory;
import com.fulfilliq.repository.InventoryLogRepository;
import com.fulfilliq.repository.InventoryTransferRepository;
import com.fulfilliq.repository.WarehouseInventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryTransferService {

    private final InventoryTransferRepository transferRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final InventoryLogRepository logRepository;

    public InventoryTransferService(InventoryTransferRepository transferRepository,
                                    WarehouseInventoryRepository inventoryRepository,
                                    InventoryLogRepository logRepository) {
        this.transferRepository = transferRepository;
        this.inventoryRepository = inventoryRepository;
        this.logRepository = logRepository;
    }

    public List<InventoryTransfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    public List<InventoryTransfer> getTransfersForWarehouse(Long warehouseId) {
        return transferRepository.findTransfersForWarehouse(warehouseId);
    }

    public InventoryTransfer getTransferById(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory transfer not found with id: " + id));
    }

    @Transactional
    public InventoryTransfer createTransfer(Long fromWarehouseId, Long toWarehouseId, List<ItemRequest> itemRequests) {
        if (fromWarehouseId.equals(toWarehouseId)) {
            throw new IllegalArgumentException("Source and destination warehouses must be different.");
        }

        InventoryTransfer transfer = new InventoryTransfer(fromWarehouseId, toWarehouseId, TransferStatus.PENDING);
        
        for (ItemRequest req : itemRequests) {
            TransferItem item = new TransferItem(transfer, req.getProductId(), req.getQuantity());
            transfer.getItems().add(item);
        }

        return transferRepository.save(transfer);
    }

    @Transactional
    public InventoryTransfer updateStatus(Long id, TransferStatus nextStatus) {
        InventoryTransfer transfer = getTransferById(id);
        
        if (transfer.getStatus() == nextStatus) {
            return transfer;
        }

        if (nextStatus == TransferStatus.IN_TRANSIT) {
            if (transfer.getStatus() != TransferStatus.PENDING) {
                throw new IllegalStateException("Only PENDING transfers can be shipped/approved.");
            }
            
            for (TransferItem item : transfer.getItems()) {
                WarehouseInventory sourceStock = inventoryRepository
                        .findByWarehouseIdAndProductIdForUpdate(transfer.getFromWarehouseId(), item.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("No inventory found at source warehouse " 
                                + transfer.getFromWarehouseId() + " for product ID: " + item.getProductId()));
                
                if (sourceStock.getAvailableStock() < item.getQuantity()) {
                    throw new IllegalStateException("Insufficient stock at source warehouse for product ID " 
                            + item.getProductId() + ". Available: " + sourceStock.getAvailableStock() + ", Required: " + item.getQuantity());
                }

                sourceStock.setAvailableStock(sourceStock.getAvailableStock() - item.getQuantity());
                inventoryRepository.save(sourceStock);

                logRepository.save(new InventoryLog(
                        transfer.getFromWarehouseId(), 
                        item.getProductId(), 
                        -item.getQuantity(), 
                        "TRANSFER_OUT_DISPATCH_#" + id
                ));
            }
        } 
        else if (nextStatus == TransferStatus.RECEIVED) {
            if (transfer.getStatus() != TransferStatus.IN_TRANSIT) {
                throw new IllegalStateException("Only IN_TRANSIT transfers can be received.");
            }

            for (TransferItem item : transfer.getItems()) {
                Optional<WarehouseInventory> destStockOpt = inventoryRepository
                        .findByWarehouseIdAndProductIdForUpdate(transfer.getToWarehouseId(), item.getProductId());
                
                WarehouseInventory destStock;
                if (destStockOpt.isPresent()) {
                    destStock = destStockOpt.get();
                    destStock.setAvailableStock(destStock.getAvailableStock() + item.getQuantity());
                } else {
                    destStock = new WarehouseInventory(transfer.getToWarehouseId(), item.getProductId(), item.getQuantity(), 0);
                }
                
                inventoryRepository.save(destStock);

                logRepository.save(new InventoryLog(
                        transfer.getToWarehouseId(), 
                        item.getProductId(), 
                        item.getQuantity(), 
                        "TRANSFER_IN_RECEIVE_#" + id
                ));
            }
        } 
        else if (nextStatus == TransferStatus.REJECTED) {
            if (transfer.getStatus() != TransferStatus.PENDING) {
                throw new IllegalStateException("Only PENDING transfers can be rejected.");
            }
        }

        transfer.setStatus(nextStatus);
        transfer.setUpdatedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    public static class ItemRequest {
        private Long productId;
        private int quantity;

        public ItemRequest() {}

        public ItemRequest(Long productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}
