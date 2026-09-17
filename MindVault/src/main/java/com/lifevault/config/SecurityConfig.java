package com.lifevault.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security filter chain for MindVault.
 *
 * <ul>
 *   <li>{@code /api/auth/**} — public (PIN setup and unlock must be reachable unauthenticated)</li>
 *   <li>{@code /api/**}       — requires a valid JWT in the Authorization header</li>
 *   <li>Everything else       — permitted (frontend static assets)</li>
 * </ul>
 *
 * CORS is configured via the {@code CorsConfigurationSource} bean in {@link AppConfig};
 * {@code Customizer.withDefaults()} picks it up automatically.
 *
 * CSRF is disabled — this is a stateless REST API and there are no browser-managed
 * session cookies to protect against.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Pick up the CorsConfigurationSource bean declared in AppConfig.
            .cors(Customizer.withDefaults())
            // Stateless REST — CSRF protection is not applicable.
            .csrf(AbstractHttpConfigurer::disable)
            // No HTTP session; every request is authenticated via JWT.
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/**").authenticated()
                    .anyRequest().permitAll()
            )
            // Return a JSON 401 instead of a redirect so the frontend can handle it.
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\":\"Authentication required\"}");
                    })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
