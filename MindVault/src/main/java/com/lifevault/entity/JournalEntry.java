package com.lifevault.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "mood", nullable = false)
    private Mood mood;

    @Column(nullable = false)
    private Integer wordCount;

    @Column(nullable = false)
    private String dayOfWeek;

    @Column(nullable = false)
    private Integer weekNumber;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "stress")
    private Integer stress;

    @Column(name = "energy")
    private Integer energy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant deletedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;

        if (wordCount == null && content != null) {
            wordCount = content.trim().isEmpty()
                    ? 0
                    : content.trim().split("\\s+").length;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();

        if (content != null) {
            wordCount = content.trim().isEmpty()
                    ? 0
                    : content.trim().split("\\s+").length;
        }
    }
}