package com.lifevault.event;

import com.lifevault.entity.Mood;

import java.time.Instant;
import java.util.UUID;

public record JournalCreatedEvent(
        UUID journalId,
        String content,
        Mood mood,
        Instant createdAt
) {
}
