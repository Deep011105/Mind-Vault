package com.lifevault.dto;

import com.lifevault.entity.JournalEntry;
import com.lifevault.entity.Mood;

import java.time.Instant;
import java.util.UUID;

public record JournalResponse(
        UUID id,
        String content,
        Mood mood,
        Integer stress,
        Integer energy,
        Integer wordCount,
        Instant createdAt,
        Instant updatedAt
) {

    public static JournalResponse from(JournalEntry entry) {
        return new JournalResponse(
                entry.getId(),
                entry.getContent(),
                entry.getMood(),
                entry.getStress(),
                entry.getEnergy(),
                entry.getWordCount(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
