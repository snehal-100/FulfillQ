package com.fulfilliq.service;

import com.fulfilliq.dto.OrderRequest;
import com.fulfilliq.dto.WarehouseDistanceResponse;
import com.fulfilliq.dto.WarehouseInventoryResponse;
import com.fulfilliq.model.Order;
import com.fulfilliq.model.OrderItem;
import com.fulfilliq.model.OrderStatus;
import com.fulfilliq.model.PaymentStatus;
import com.fulfilliq.model.OutboxEvent;
import com.fulfilliq.repository.OrderItemRepository;
import com.fulfilliq.repository.OrderRepository;
import com.fulfilliq.repository.OutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OutboxRepository outboxRepository;
    private final RestTemplate restTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

    @Value("${services.inventory.url}")
    private String inventoryServiceUrl;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        OutboxRepository outboxRepository,
                        RestTemplate restTemplate,
                        KafkaTemplate<String, String> kafkaTemplate,
                        ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.outboxRepository = outboxRepository;
        this.restTemplate = restTemplate;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Order> getOrdersByCustomerId(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + id));
    }

    @Transactional
    public Order placeOrder(OrderRequest request) {
        // 1. Fetch warehouses sorted by distance
        String warehouseUrl = warehouseServiceUrl + "/api/warehouses/nearest?lat=" + request.getLatitude() + "&lon=" + request.getLongitude();
        WarehouseDistanceResponse[] sortedWarehouses;
        try {
            sortedWarehouses = restTemplate.getForObject(warehouseUrl, WarehouseDistanceResponse[].class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to query Warehouse Service: " + e.getMessage());
        }

        if (sortedWarehouses == null || sortedWarehouses.length == 0) {
            throw new IllegalArgumentException("No warehouses available to fulfill the order");
        }

        // List to hold planned allocations before executing reservations
        List<AllocationPlan> allocationPlans = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // 2. Determine allocation split across warehouses for each requested item
        for (OrderRequest.ItemRequest item : request.getItems()) {
            Long productId = item.getProductId();
            int requestedQuantity = item.getQuantity();
            int remainingToAllocate = requestedQuantity;

            // Fetch inventory for this product across all warehouses
            String inventoryUrl = inventoryServiceUrl + "/api/inventory/product/" + productId;
            WarehouseInventoryResponse[] inventories;
            try {
                inventories = restTemplate.getForObject(inventoryUrl, WarehouseInventoryResponse[].class);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to query Inventory Service: " + e.getMessage());
            }

            // Map available inventory by warehouseId for quick access
            Map<Long, Integer> inventoryMap = new HashMap<>();
            if (inventories != null) {
                for (WarehouseInventoryResponse inv : inventories) {
                    inventoryMap.put(inv.getWarehouseId(), inv.getAvailableStock());
                }
            }

            // Fetch product price from catalog service (inventory-service)
            BigDecimal price = BigDecimal.valueOf(100.00); // Default fallback
            try {
                String productUrl = inventoryServiceUrl + "/api/inventory/products/" + productId;
                Map<?, ?> productDetails = restTemplate.getForObject(productUrl, Map.class);
                if (productDetails != null && productDetails.containsKey("price")) {
                    price = new BigDecimal(productDetails.get("price").toString());
                }
            } catch (Exception e) {
                // Keep default price if call fails
            }

            // Walk through warehouses sorted by proximity
            for (WarehouseDistanceResponse distanceResponse : sortedWarehouses) {
                Long warehouseId = distanceResponse.getWarehouse().getId();
                int availableStock = inventoryMap.getOrDefault(warehouseId, 0);

                if (availableStock > 0 && remainingToAllocate > 0) {
                    int toTake = Math.min(remainingToAllocate, availableStock);
                    allocationPlans.add(new AllocationPlan(warehouseId, productId, toTake, price));
                    remainingToAllocate -= toTake;
                }
            }

            // If we couldn't allocate the entire requested quantity, fail order immediately (insufficient total inventory)
            if (remainingToAllocate > 0) {
                throw new IllegalArgumentException("Insufficient inventory available for product ID: " + productId + ". Missing quantity: " + remainingToAllocate);
            }

            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(requestedQuantity)));
        }

        // Mock shipping cost based on distance of first warehouse (nearest)
        double nearestDistance = sortedWarehouses[0].getDistanceKm();
        BigDecimal shippingCost = BigDecimal.valueOf(Math.max(5.0, nearestDistance * 0.5)); // $0.5 per km

        // 3. Save order in PENDING status
        Order order = new Order(
                request.getCustomerId(),
                OrderStatus.PENDING,
                PaymentStatus.PENDING,
                shippingCost,
                totalAmount.add(shippingCost)
        );
        Order savedOrder = orderRepository.save(order);

        // Saga Step 1: Process Payment
        boolean paymentSuccess = simulatePayment(savedOrder);
        if (!paymentSuccess) {
            savedOrder.setStatus(OrderStatus.CANCELLED);
            savedOrder.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(savedOrder);
            throw new IllegalStateException("Payment failed for Order: " + savedOrder.getId());
        }

        // Payment succeeded -> Update payment status
        savedOrder.setPaymentStatus(PaymentStatus.COMPLETED);
        orderRepository.save(savedOrder);

        // 4. Reserve stock in Inventory Service. Rollback and compensate if any fails.
        List<AllocationPlan> successfulReservations = new ArrayList<>();
        boolean reservationSuccess = true;

        for (AllocationPlan plan : allocationPlans) {
            String reserveUrl = inventoryServiceUrl + "/api/inventory/reserve";
            Map<String, Object> reserveBody = Map.of(
                    "warehouseId", plan.warehouseId,
                    "productId", plan.productId,
                    "quantity", plan.quantity,
                    "orderId", savedOrder.getId()
            );

            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(reserveUrl, reserveBody, Map.class);
                if (response.getStatusCode().is2xxSuccessful() && Boolean.TRUE.equals(response.getBody().get("success"))) {
                    successfulReservations.add(plan);
                } else {
                    reservationSuccess = false;
                    break;
                }
            } catch (Exception e) {
                reservationSuccess = false;
                break;
            }
        }

        // Rollback reservations if any fail
        if (!reservationSuccess) {
            for (AllocationPlan plan : successfulReservations) {
                String releaseUrl = inventoryServiceUrl + "/api/inventory/release";
                Map<String, Object> releaseBody = Map.of(
                        "warehouseId", plan.warehouseId,
                        "productId", plan.productId,
                        "quantity", plan.quantity,
                        "orderId", savedOrder.getId()
                );
                try {
                    restTemplate.postForEntity(releaseUrl, releaseBody, Map.class);
                } catch (Exception e) {
                    System.err.println("CRITICAL: Failed to rollback reservation of product: " + plan.productId + " at warehouse: " + plan.warehouseId + ". Error: " + e.getMessage());
                }
            }

            // Saga Compensating Step: Automatic Refund!
            compensateRefund(savedOrder);
            throw new IllegalStateException("Failed to reserve stock due to concurrent allocation conflict. Compensating refund processed.");
        }

        // 5. Save OrderItems
        for (AllocationPlan plan : allocationPlans) {
            OrderItem orderItem = new OrderItem(
                    savedOrder.getId(),
                    plan.productId,
                    plan.quantity,
                    plan.price,
                    plan.warehouseId
            );
            orderItemRepository.save(orderItem);
        }

        // Update status to RESERVED since reservation succeeded
        savedOrder.setStatus(OrderStatus.RESERVED);
        orderRepository.save(savedOrder);

        // 6. Publish order-created Outbox Event
        publishOrderCreatedEvent(savedOrder, allocationPlans);

        return savedOrder;
    }

    private boolean simulatePayment(Order order) {
        System.out.println("[SAGA ORCHESTRATOR] Initiating payment for Order #" + order.getId() + " of amount ₹" + order.getTotalAmount());
        return true;
    }

    private void compensateRefund(Order order) {
        System.out.println("[SAGA COMPENSATION] Stock reservation failed. Initiating automatic refund for Order #" + order.getId() + " of amount ₹" + order.getTotalAmount());
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        publishOrderCancelledEvent(order);
    }

    private void publishOrderCreatedEvent(Order order, List<AllocationPlan> allocations) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("orderId", order.getId());
            event.put("customerId", order.getCustomerId());
            event.put("totalAmount", order.getTotalAmount());
            event.put("shippingCost", order.getShippingCost());
            
            List<Map<String, Object>> allocList = new ArrayList<>();
            for (AllocationPlan plan : allocations) {
                allocList.add(Map.of(
                    "warehouseId", plan.warehouseId,
                    "productId", plan.productId,
                    "quantity", plan.quantity,
                    "price", plan.price
                ));
            }
            event.put("splits", allocList);

            String message = objectMapper.writeValueAsString(event);
            
            // Transactional Outbox Pattern insertion
            OutboxEvent outboxEvent = new OutboxEvent("Order", order.getId(), "ORDER_CREATED", message);
            outboxRepository.save(outboxEvent);
            System.out.println("[OUTBOX PATTERN] ORDER_CREATED event saved atomically to database.");
        } catch (Exception e) {
            System.err.println("Failed to write ORDER_CREATED outbox event. Error: " + e.getMessage());
        }
    }

    private void publishOrderCancelledEvent(Order order) {
        try {
            Map<String, Object> event = Map.of(
                "orderId", order.getId(),
                "customerId", order.getCustomerId(),
                "status", "CANCELLED",
                "paymentStatus", "REFUNDED"
            );
            String message = objectMapper.writeValueAsString(event);
            
            // Transactional Outbox Pattern insertion
            OutboxEvent outboxEvent = new OutboxEvent("Order", order.getId(), "ORDER_CANCELLED", message);
            outboxRepository.save(outboxEvent);
            System.out.println("[OUTBOX PATTERN] ORDER_CANCELLED compensation event saved atomically.");
        } catch (Exception e) {
            System.err.println("Failed to write ORDER_CANCELLED outbox event. Error: " + e.getMessage());
        }
    }

    @Transactional
    public Order processPaymentCallback(Long orderId, String paymentId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));
                
        // Idempotency barrier check
        if (order.getPaymentStatus() == PaymentStatus.COMPLETED) {
            System.out.println("[IDEMPOTENCY GUARD] Webhook transaction already processed for Order #" + orderId + ". Refusing duplicate callback execution.");
            return order;
        }
        
        System.out.println("[IDEMPOTENCY GUARD] Processing payment callback webhook for Order #" + orderId + ", Reference: " + paymentId);
        if ("SUCCESS".equalsIgnoreCase(status)) {
            order.setPaymentStatus(PaymentStatus.COMPLETED);
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }
        return orderRepository.save(order);
    }

    private static class AllocationPlan {
        Long warehouseId;
        Long productId;
        int quantity;
        BigDecimal price;

        AllocationPlan(Long warehouseId, Long productId, int quantity, BigDecimal price) {
            this.warehouseId = warehouseId;
            this.productId = productId;
            this.quantity = quantity;
            this.price = price;
        }
    }
}
