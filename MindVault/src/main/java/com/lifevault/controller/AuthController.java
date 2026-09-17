package com.lifevault.controller;

import com.lifevault.dto.PinRequest;
import com.lifevault.service.PinAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public endpoints for PIN-based authentication.
 * All routes under /api/auth/** are explicitly permitted in SecurityConfig.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final PinAuthService pinAuthService;

    /**
     * GET /api/auth/status
     * Returns whether a PIN has been configured. The frontend uses this on
     * startup to decide between the setup screen and the lock screen.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        return ResponseEntity.ok(Map.of("pinConfigured", pinAuthService.isPinConfigured()));
    }

    /**
     * POST /api/auth/setup  { "pin": "1234" }
     * First-run only. Hashes and stores the PIN, returns a JWT so the user
     * is immediately logged in without a separate unlock call.
     * Returns 409 if a PIN is already configured.
     */
    @PostMapping("/setup")
    public ResponseEntity<Map<String, String>> setup(@Valid @RequestBody PinRequest request) {
        String token = pinAuthService.setupPin(request.pin());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", token));
    }

    /**
     * POST /api/auth/unlock  { "pin": "1234" }
     * Verifies the PIN and returns a 24-hour JWT on success.
     * Returns 401 on wrong PIN (handled by GlobalExceptionHandler).
     */
    @PostMapping("/unlock")
    public ResponseEntity<Map<String, String>> unlock(@Valid @RequestBody PinRequest request) {
        String token = pinAuthService.verifyPin(request.pin());
        return ResponseEntity.ok(Map.of("token", token));
    }
}
