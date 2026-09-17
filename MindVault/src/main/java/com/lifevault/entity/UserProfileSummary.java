package com.lifevault.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * There is intentionally only ever ONE row of this in a single-user local install.
 * It is the "long-term memory" layer: a compact, continuously-updated summary of
 * recurring themes, goals, coping patterns and tone preferences, distilled from the
 * full journal history. It is cheap to include in every chat prompt because it's a
 * small fixed-size block, not the entire history.
 */
@Entity
@Table(name = "user_profile_summary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summaryText;

    @Column(nullable = false)
    private Integer entriesIncorporated;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = Instant.now();
    }
}
