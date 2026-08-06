package com.fulfilliq.warehouse.service;

import com.fulfilliq.warehouse.dto.WarehouseDistanceResponse;
import com.fulfilliq.warehouse.model.Warehouse;
import com.fulfilliq.warehouse.repository.WarehouseRepository;
import com.fulfilliq.warehouse.util.DistanceCalculator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found with id: " + id));
    }

    public Warehouse createWarehouse(Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    public Warehouse updateWarehouse(Long id, Warehouse details) {
        Warehouse warehouse = getWarehouseById(id);
        warehouse.setName(details.getName());
        warehouse.setLatitude(details.getLatitude());
        warehouse.setLongitude(details.getLongitude());
        warehouse.setAddress(details.getAddress());
        warehouse.setCapacity(details.getCapacity());
        warehouse.setManagerId(details.getManagerId());
        return warehouseRepository.save(warehouse);
    }

    public void deleteWarehouse(Long id) {
        Warehouse warehouse = getWarehouseById(id);
        warehouseRepository.delete(warehouse);
    }

    public List<WarehouseDistanceResponse> getWarehousesSortedByProximity(double customerLat, double customerLon) {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        return warehouses.stream()
                .map(w -> {
                    double dist = DistanceCalculator.calculateDistance(customerLat, customerLon, w.getLatitude(), w.getLongitude());
                    return new WarehouseDistanceResponse(w, dist);
                })
                .sorted((w1, w2) -> Double.compare(w1.getDistanceKm(), w2.getDistanceKm()))
                .collect(Collectors.toList());
    }

    public Warehouse getWarehouseByManagerId(Long managerId) {
        return warehouseRepository.findByManagerId(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Warehouse not found for manager: " + managerId));
    }
}
