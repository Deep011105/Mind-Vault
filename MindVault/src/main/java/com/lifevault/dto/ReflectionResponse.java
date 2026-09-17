package com.lifevault.dto;

import java.util.List;

public record ReflectionResponse(
        String aiResponse,
        List<String> skippedReasonsExtracted,
        String keyLearning
) {}
