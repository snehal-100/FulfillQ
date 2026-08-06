package com.fulfilliq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fulfilliq.dto.OrderRequest;
import com.fulfilliq.dto.WarehouseDistanceResponse;
import com.fulfilliq.dto.WarehouseInventoryResponse;
import com.fulfilliq.model.Order;
import com.fulfilliq.model.OrderStatus;
import com.fulfilliq.model.PaymentStatus;
import com.fulfilliq.repository.OrderItemRepository;
import com.fulfilliq.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private OrderService orderService;

    @BeforeEach
    public void setup() {
        ReflectionTestUtils.setField(orderService, "warehouseServiceUrl", "http://warehouse-service:8082");
        ReflectionTestUtils.setField(orderService, "inventoryServiceUrl", "http://inventory-service:8083");
    }

    @Test
    public void testSuccessfulOrderSplitting() {
        // Arrange
        OrderRequest request = new OrderRequest();
        request.setCustomerId(999L);
        request.setLatitude(28.6139);
        request.setLongitude(77.2090);

        OrderRequest.ItemRequest item = new OrderRequest.ItemRequest();
        item.setProductId(1L);
        item.setQuantity(8);
        request.setItems(List.of(item));

        // Mock sorted warehouses by proximity: WH 1 (nearest, distance 5km), WH 2 (further, distance 15km)
        WarehouseDistanceResponse wh1 = new WarehouseDistanceResponse();
        WarehouseDistanceResponse.WarehouseDto whDto1 = new WarehouseDistanceResponse.WarehouseDto();
        whDto1.setId(1L);
        whDto1.setName("Delhi Hub");
        wh1.setWarehouse(whDto1);
        wh1.setDistanceKm(5.0);

        WarehouseDistanceResponse wh2 = new WarehouseDistanceResponse();
        WarehouseDistanceResponse.WarehouseDto whDto2 = new WarehouseDistanceResponse.WarehouseDto();
        whDto2.setId(2L);
        whDto2.setName("Mumbai Terminal");
        wh2.setWarehouse(whDto2);
        wh2.setDistanceKm(15.0);

        when(restTemplate.getForObject(contains("/api/warehouses/nearest"), eq(WarehouseDistanceResponse[].class)))
                .thenReturn(new WarehouseDistanceResponse[]{wh1, wh2});

        // Mock inventories: Product 1 has 5 units in WH 1, and 10 units in WH 2.
        WarehouseInventoryResponse inv1 = new WarehouseInventoryResponse();
        inv1.setWarehouseId(1L);
        inv1.setProductId(1L);
        inv1.setAvailableStock(5);

        WarehouseInventoryResponse inv2 = new WarehouseInventoryResponse();
        inv2.setWarehouseId(2L);
        inv2.setProductId(1L);
        inv2.setAvailableStock(10);

        when(restTemplate.getForObject(contains("/api/inventory/product/1"), eq(WarehouseInventoryResponse[].class)))
                .thenReturn(new WarehouseInventoryResponse[]{inv1, inv2});

        // Mock product details query
        when(restTemplate.getForObject(contains("/api/inventory/products/1"), eq(Map.class)))
                .thenReturn(Map.of("id", 1, "price", 100.00));

        // Mock order save
        Order mockSavedOrder = new Order(999L, OrderStatus.PENDING, PaymentStatus.PENDING, BigDecimal.valueOf(7.5), BigDecimal.valueOf(807.5));
        mockSavedOrder.setId(123L);
        when(orderRepository.save(any(Order.class))).thenReturn(mockSavedOrder);

        // Mock successful reservation responses
        Map<String, Object> successBody = new HashMap<>();
        successBody.put("success", true);
        when(restTemplate.postForEntity(contains("/api/inventory/reserve"), anyMap(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(successBody));

        // Act
        Order order = orderService.placeOrder(request);

        // Assert
        assertNotNull(order);
        assertEquals(123L, order.getId());
        assertEquals(OrderStatus.RESERVED, order.getStatus());
        
        // Verify we reserve 5 from WH 1 and remaining 3 from WH 2
        verify(restTemplate).postForEntity(contains("/api/inventory/reserve"), eq(Map.of("warehouseId", 1L, "productId", 1L, "quantity", 5, "orderId", 123L)), eq(Map.class));
        verify(restTemplate).postForEntity(contains("/api/inventory/reserve"), eq(Map.of("warehouseId", 2L, "productId", 1L, "quantity", 3, "orderId", 123L)), eq(Map.class));
        verify(orderItemRepository, times(2)).save(any());
    }

    @Test
    public void testInsufficientInventoryFails() {
        // Arrange
        OrderRequest request = new OrderRequest();
        request.setCustomerId(999L);
        request.setLatitude(28.6139);
        request.setLongitude(77.2090);

        OrderRequest.ItemRequest item = new OrderRequest.ItemRequest();
        item.setProductId(1L);
        item.setQuantity(20); // total stock will be 5 + 10 = 15
        request.setItems(List.of(item));

        WarehouseDistanceResponse wh1 = new WarehouseDistanceResponse();
        WarehouseDistanceResponse.WarehouseDto whDto1 = new WarehouseDistanceResponse.WarehouseDto();
        whDto1.setId(1L);
        wh1.setWarehouse(whDto1);
        wh1.setDistanceKm(5.0);

        when(restTemplate.getForObject(contains("/api/warehouses/nearest"), eq(WarehouseDistanceResponse[].class)))
                .thenReturn(new WarehouseDistanceResponse[]{wh1});

        WarehouseInventoryResponse inv1 = new WarehouseInventoryResponse();
        inv1.setWarehouseId(1L);
        inv1.setProductId(1L);
        inv1.setAvailableStock(15);

        when(restTemplate.getForObject(contains("/api/inventory/product/1"), eq(WarehouseInventoryResponse[].class)))
                .thenReturn(new WarehouseInventoryResponse[]{inv1});

        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.placeOrder(request);
        });

        assertTrue(exception.getMessage().contains("Insufficient inventory"));
    }
}
