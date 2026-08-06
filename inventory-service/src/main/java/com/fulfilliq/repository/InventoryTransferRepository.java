package com.fulfilliq.repository;

import com.fulfilliq.model.InventoryTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransferRepository extends JpaRepository<InventoryTransfer, Long> {
    
    @Query("SELECT t FROM InventoryTransfer t WHERE t.fromWarehouseId = :whId OR t.toWarehouseId = :whId ORDER BY t.createdAt DESC")
    List<InventoryTransfer> findTransfersForWarehouse(@Param("whId") Long whId);
}
