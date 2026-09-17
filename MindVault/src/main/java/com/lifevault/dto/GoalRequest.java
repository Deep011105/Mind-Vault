package com.lifevault.dto;

import com.lifevault.entity.GoalPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GoalRequest(
        @NotBlank(message = "Title is required")
        String title,
        String description,
        @NotNull(message = "Priority is required")
        GoalPriority priority,
        LocalDate deadline,
        Integer dailyTargetMinutes
) {}
