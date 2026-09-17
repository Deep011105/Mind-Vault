package com.lifevault.dto;

import com.lifevault.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(
        @NotNull(message = "Status is required")
        TaskStatus status,
        String reasonSkipped
) {}
