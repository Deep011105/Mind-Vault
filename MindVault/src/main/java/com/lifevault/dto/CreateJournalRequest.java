package com.lifevault.dto;

import com.lifevault.entity.Mood;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateJournalRequest(

        @NotBlank(message = "Content cannot be empty")
        @Size(max = 10000, message = "Content cannot exceed 10000 characters")
        String content,

        @NotNull(message = "Mood is required")
        Mood mood,

        @Min(value = 1, message = "Stress must be between 1 and 5")
        @Max(value = 5, message = "Stress must be between 1 and 5")
        Integer stress,

        @Min(value = 1, message = "Energy must be between 1 and 5")
        @Max(value = 5, message = "Energy must be between 1 and 5")
        Integer energy
) {}