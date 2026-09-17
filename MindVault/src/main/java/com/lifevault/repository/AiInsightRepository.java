package com.lifevault.repository;

import com.lifevault.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiInsightRepository extends JpaRepository<AiInsight, UUID> {
    List<AiInsight> findAllByOrderByGeneratedAtDesc();
    Optional<AiInsight> findByType(String type);
}
