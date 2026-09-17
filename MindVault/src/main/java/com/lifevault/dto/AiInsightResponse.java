package com.lifevault.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AiInsightResponse(
        UUID id,
        String type,
        String description,
        Integer confidence,
        LocalDateTime generatedAt
) {}
