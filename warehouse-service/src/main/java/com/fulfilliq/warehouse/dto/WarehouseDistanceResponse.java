package com.fulfilliq.warehouse.dto;

import com.fulfilliq.warehouse.model.Warehouse;

public class WarehouseDistanceResponse {
    private Warehouse warehouse;
    private double distanceKm;

    public WarehouseDistanceResponse(Warehouse warehouse, double distanceKm) {
        this.warehouse = warehouse;
        this.distanceKm = distanceKm;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }
}
