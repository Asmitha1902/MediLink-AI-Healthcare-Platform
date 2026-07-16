package com.medilink.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.medilink.backend.repository.UserRepository;
import com.medilink.backend.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Hospital public APIs
                        .requestMatchers(
                                "/api/hospital/register",
                                "/api/hospital/login",
                                "/api/hospital/verify-otp",
                                "/api/hospital/resend-otp"
                        ).permitAll()

                        // Patient public APIs
                        .requestMatchers(
                                "/api/patient/register",
                                "/api/patient/login",
                                "/api/patient/verify-otp",
                                "/api/patient/resend-otp"
                        ).permitAll()

                        // Doctor public API
                        .requestMatchers("/api/doctor/login").permitAll()

                        // QR shared records public API
                        .requestMatchers("/api/patient/access-requests/email/**").permitAll()

                        // Hospital admin doctor management APIs
                        .requestMatchers(HttpMethod.POST, "/api/doctor/add").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/doctor/all").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/doctor/*/status").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/doctor/*/queue").hasAuthority("ROLE_ADMIN")

                        // Doctor own APIs
                        .requestMatchers(HttpMethod.GET, "/api/doctor/profile").hasAuthority("ROLE_DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/doctor/change-password").hasAuthority("ROLE_DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/doctor/my-status").hasAuthority("ROLE_DOCTOR")

                        // Protected role-based APIs
                        .requestMatchers("/api/hospital/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/patient/**").hasAuthority("ROLE_PATIENT")
                        .requestMatchers("/api/doctor/**").hasAuthority("ROLE_DOCTOR")

                        // Other APIs
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {

        return email -> {
            com.medilink.backend.entity.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .authorities(user.getRole().name())
                    .build();
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService());

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}