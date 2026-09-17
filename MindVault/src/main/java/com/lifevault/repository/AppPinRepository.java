package com.lifevault.repository;

import com.lifevault.entity.AppPin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppPinRepository extends JpaRepository<AppPin, UUID> {

    /** Returns the most recently stored PIN hash (should be at most one row). */
    Optional<AppPin> findTopByOrderByCreatedAtDesc();

    /** Quick existence check — used to determine whether setup has been done. */
    boolean existsBy();
}
