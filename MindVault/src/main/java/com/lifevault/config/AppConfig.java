package com.lifevault.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * General application beans that don't belong in a more specific config class.
 * BCryptPasswordEncoder is declared here (not in SecurityConfig) to avoid
 * a circular dependency: SecurityConfig → JwtAuthFilter → PinAuthService → encoder.
 *
 * CorsConfigurationSource is declared here so it can be picked up by both
 * Spring Security (via Customizer.withDefaults()) and any MVC layer.
 * This replaces the old WebMvcConfigurer-based CorsConfig.
 */
@Configuration
public class AppConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Allow all headers, including Authorization which carries the JWT.
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /**
     * Used for short, explicit transaction boundaries around DB-only work (e.g. in
     * DailyPlanService) so a blocking external call — like a local LLM request via
     * Ollama — never happens while a DB transaction/connection is held open.
     * Programmatic (TransactionTemplate) rather than @Transactional so it still
     * works correctly on self-invocation within the same class.
     */
    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        return new TransactionTemplate(transactionManager);
    }
}