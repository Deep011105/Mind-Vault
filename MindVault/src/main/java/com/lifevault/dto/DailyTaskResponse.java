package com.lifevault.dto;

import com.lifevault.entity.GoalPriority;
import com.lifevault.entity.TaskStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record DailyTaskResponse(
        UUID id,
        String title,
        GoalPriority priority,
        Integer estimatedMinutes,
        TaskStatus status,
        String reasonSkipped,
        boolean isOptional,
        int sortOrder,
        LocalDateTime startedAt,
        LocalDateTime completedAt
) {}
