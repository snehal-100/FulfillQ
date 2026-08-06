package com.fulfilliq.listener;

import com.fulfilliq.handler.NotificationWebSocketHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {

    private final NotificationWebSocketHandler webSocketHandler;

    public NotificationListener(NotificationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @KafkaListener(topics = {"order-created", "inventory-reserved", "inventory-released", "shipment-created", "shipment-delivered", "notification-events"}, groupId = "notification-group")
    public void listenEvents(String message) {
        // 1. Simulate sending Email/SMS
        System.out.println("[NOTIFICATION SERVICE] Dispatching Alert/Email/SMS with payload: " + message);

        // 2. Real-time push to frontend dashboard via WebSockets
        webSocketHandler.broadcast(message);
    }
}
