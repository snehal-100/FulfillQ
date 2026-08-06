package com.fulfilliq.repository;

import com.fulfilliq.model.WarehouseInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, Long> {

    Optional<WarehouseInventory> findByWarehouseIdAndProductId(Long warehouseId, Long productId);

    List<WarehouseInventory> findByProductId(Long productId);

    List<WarehouseInventory> findByWarehouseId(Long warehouseId);

    // Pessimistic Write Lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wi FROM WarehouseInventory wi WHERE wi.warehouseId = :warehouseId AND wi.productId = :productId")
    Optional<WarehouseInventory> findByWarehouseIdAndProductIdForUpdate(Long warehouseId, Long productId);
}
