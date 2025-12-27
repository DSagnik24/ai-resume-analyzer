package com.example.authbackend.controller;

import com.example.authbackend.dto.AuthDTOs;
import com.example.authbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    /**
     * Constructor for AuthController.
     *
     * @param jwtUtil the JWT utility
     */
    @Autowired
    public AuthController(final JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /**
     * Login endpoint that generates JWT tokens.
     *
     * @param loginRequest the login request containing username and password
     * @return the authentication response with tokens
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDTOs.AuthResponse> login(
        @RequestBody final AuthDTOs.LoginRequest loginRequest) {
        
        // For demonstration: accept any non-empty username/password
        // In production, validate against database with proper password hashing
        if (loginRequest.getUsername() == null || loginRequest.getUsername().isEmpty()
            || loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty()) {
            throw new BadCredentialsException("Invalid username or password");
        }

        final String username = loginRequest.getUsername();
        final String accessToken = jwtUtil.generateAccessToken(username);
        final String refreshToken = jwtUtil.generateRefreshToken(username);

        final AuthDTOs.UserDTO user = new AuthDTOs.UserDTO(
            username,
            username,
            username + "@example.com"
        );

        return ResponseEntity.ok(new AuthDTOs.AuthResponse(user, accessToken, refreshToken));
    }

    /**
     * Endpoint to get current authenticated user.
     *
     * @return the current user
     */
    @GetMapping("/me")
    public ResponseEntity<AuthDTOs.UserDTO> getCurrentUser() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Reject anonymous authentication (Spring may provide an anonymous principal)
        if (authentication == null || !authentication.isAuthenticated() ||
            authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken ||
            "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        final String username = authentication.getName();
        final AuthDTOs.UserDTO user = new AuthDTOs.UserDTO(
            username,
            username,
            username + "@example.com"
        );

        return ResponseEntity.ok(user);
    }

    /**
     * Logout endpoint.
     *
     * @return response indicating logout success
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }
}
