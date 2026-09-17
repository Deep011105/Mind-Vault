package com.lifevault.dto;

import com.lifevault.entity.GoalPriority;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String title,
        String description,
        GoalPriority priority,
        LocalDate deadline,
        Integer dailyTargetMinutes,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
