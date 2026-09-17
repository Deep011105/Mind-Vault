package com.lifevault.service;

import com.lifevault.entity.AppPin;
import com.lifevault.repository.AppPinRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;

/**
 * Core PIN authentication logic.
 *
 * <ul>
 *   <li>PINs are bcrypt-hashed before storage — the raw digit string never persists.</li>
 *   <li>On successful verification a stateless HS256 JWT is issued (24 h default).</li>
 *   <li>Token validation is fully in-memory — no DB round-trip per request.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PinAuthService {

    private final AppPinRepository repository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.pin.jwt-secret}")
    private String jwtSecret;

    @Value("${app.pin.token-validity-hours:24}")
    private long tokenValidityHours;

    /** True if the user has already gone through first-run PIN setup. */
    public boolean isPinConfigured() {
        return repository.existsBy();
    }

    /**
     * First-run PIN creation. Hashes and persists the PIN, then issues a token
     * so the user is immediately logged in without a second unlock call.
     *
     * @throws IllegalStateException if a PIN has already been configured.
     */
    @Transactional
    public String setupPin(String rawPin) {
        if (isPinConfigured()) {
            throw new IllegalStateException("PIN is already configured.");
        }
        AppPin pin = AppPin.builder()
                .pinHash(passwordEncoder.encode(rawPin))
                .build();
        repository.save(pin);
        log.info("PIN configured for MindVault");
        return generateToken();
    }

    /**
     * Verifies the supplied raw PIN against the stored hash and issues a token.
     *
     * @throws BadCredentialsException on mismatch.
     */
    public String verifyPin(String rawPin) {
        AppPin stored = repository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new IllegalStateException("No PIN has been configured yet."));
        if (!passwordEncoder.matches(rawPin, stored.getPinHash())) {
            log.warn("Failed PIN unlock attempt");
            throw new BadCredentialsException("Invalid PIN");
        }
        return generateToken();
    }

    /**
     * Validates a JWT token. Returns false (rather than throwing) so the filter
     * can cleanly fall through to the 401 handler instead of producing a 500.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String generateToken() {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject("mindvault-user")
                .issuedAt(new Date(now))
                .expiration(new Date(now + tokenValidityHours * 3_600_000L))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Derives a 32-byte HS256 key from the configured secret string.
     * The secret is zero-padded (or truncated) to exactly 32 bytes so short
     * config values don't cause a key-too-short exception.
     */
    private SecretKey getSigningKey() {
        byte[] src = jwtSecret.getBytes(StandardCharsets.UTF_8);
        byte[] key = Arrays.copyOf(src, 32); // pads with zeros if shorter
        return Keys.hmacShaKeyFor(key);
    }
}
