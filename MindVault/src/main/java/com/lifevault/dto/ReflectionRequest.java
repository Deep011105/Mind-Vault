package com.lifevault.dto;

import jakarta.validation.constraints.NotBlank;

public record ReflectionRequest(
        @NotBlank(message = "Reflection text is required")
        String reflectionText
) {}
