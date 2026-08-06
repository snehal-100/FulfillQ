package com.fulfilliq.repository;

import com.fulfilliq.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByOrderId(Long orderId);
    List<Shipment> findByWarehouseId(Long warehouseId);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
}
