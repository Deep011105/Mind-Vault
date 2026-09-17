package com.lifevault.dto;

import com.lifevault.entity.ChatMessage;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(
        UUID id,
        String role,
        String content,
        boolean safetyIntercepted,
        Instant createdAt
) {
    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(
                m.getId(),
                m.getRole().name(),
                m.getContent(),
                m.isSafetyIntercepted(),
                m.getCreatedAt()
        );
    }
}
