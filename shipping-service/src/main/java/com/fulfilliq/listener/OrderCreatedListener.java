package com.fulfilliq.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fulfilliq.service.ShippingService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class OrderCreatedListener {

    private final ShippingService shippingService;
    private final ObjectMapper objectMapper;

    public OrderCreatedListener(ShippingService shippingService, ObjectMapper objectMapper) {
        this.shippingService = shippingService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "order-created", groupId = "shipping-group")
    public void handleOrderCreated(String message) {
        try {
            Map<?, ?> event = objectMapper.readValue(message, Map.class);
            Long orderId = Long.valueOf(event.get("orderId").toString());
            List<Map<?, ?>> splits = (List<Map<?, ?>>) event.get("splits");

            if (splits != null) {
                Set<Long> warehouseIds = new HashSet<>();
                for (Map<?, ?> split : splits) {
                    Long warehouseId = Long.valueOf(split.get("warehouseId").toString());
                    warehouseIds.add(warehouseId);
                }

                for (Long warehouseId : warehouseIds) {
                    shippingService.createShipment(orderId, warehouseId);
                }
            }
        } catch (Exception e) {
            System.err.println("Error consuming order-created Kafka event in shipping-service: " + e.getMessage());
            throw new RuntimeException("Kafka Listener processing failure", e);
        }
    }
}
