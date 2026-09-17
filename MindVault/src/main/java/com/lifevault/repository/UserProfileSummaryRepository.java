package com.lifevault.repository;

import com.lifevault.entity.UserProfileSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileSummaryRepository extends JpaRepository<UserProfileSummary, UUID> {

    Optional<UserProfileSummary> findFirstByOrderByUpdatedAtDesc();
}
