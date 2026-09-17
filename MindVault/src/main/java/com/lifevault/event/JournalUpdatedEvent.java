package com.lifevault.event;

import com.lifevault.entity.Mood;

import java.time.Instant;
import java.util.UUID;

public record JournalUpdatedEvent(
        UUID journalId,
        String content,
        Mood mood,
        Instant updatedAt
) {
}
