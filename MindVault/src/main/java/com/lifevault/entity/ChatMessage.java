package com.lifevault.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * True if the safety layer intercepted this turn before the LLM was called.
     * Kept so the UI/analytics can distinguish "the model said this" from
     * "the deterministic safety layer said this".
     */
    @Column(nullable = false)
    private boolean safetyIntercepted;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public enum ChatRole {
        USER,
        ASSISTANT
    }
}
