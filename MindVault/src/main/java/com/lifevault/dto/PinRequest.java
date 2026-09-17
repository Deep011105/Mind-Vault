package com.lifevault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body for PIN setup and unlock endpoints.
 * Validation enforces 4–8 digits only — no letters, no symbols.
 */
public record PinRequest(
        @NotBlank(message = "PIN is required")
        @Pattern(regexp = "\\d{4,8}", message = "PIN must be 4 to 8 digits")
        String pin
) {}
