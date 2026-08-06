package com.fulfilliq.service;

import com.fulfilliq.model.OutboxEvent;
import com.fulfilliq.repository.OutboxRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@EnableScheduling
public class OutboxScheduler {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxScheduler(OutboxRepository outboxRepository, KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByProcessedFalseOrderByCreatedAtAsc();
        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            try {
                String topic = "order-created";
                if ("ORDER_CANCELLED".equals(event.getEventType())) {
                    topic = "order-cancelled";
                }
                
                // Synchronously await broker ack
                kafkaTemplate.send(topic, event.getPayload()).get();
                
                // Delete event upon successful delivery
                outboxRepository.delete(event);
            } catch (Exception e) {
                System.err.println("Outbox Pattern Failure: Failed to dispatch outbox event #" + event.getId() + " to Kafka topic. Error: " + e.getMessage());
            }
        }
    }
}
