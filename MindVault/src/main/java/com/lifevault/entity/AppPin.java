package com.lifevault.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Stores the bcrypt hash of the user's PIN.
 * There is intentionally only ONE row in this table for a single-user install.
 * Changing the PIN = delete existing row + insert a new one.
 */
@Entity
@Table(name = "app_pin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppPin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String pinHash;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }
}
