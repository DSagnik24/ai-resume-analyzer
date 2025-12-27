package com.example.authbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for JWT token generation and validation.
 */
@Component
public class JwtUtil {

    private static final String SECRET_KEY = "MyVeryLongSecretKeyForJWTSigningThatIsAtLeast256BitsLongForHS256Algorithm123456";
    private static final long EXPIRATION_TIME = 86400000; // 24 hours in milliseconds
    private static final long REFRESH_EXPIRATION_TIME = 604800000; // 7 days in milliseconds

    private final SecretKey key;

    /**
     * Constructor for JwtUtil.
     */
    public JwtUtil() {
        this.key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    /**
     * Generates a JWT access token for the given username.
     *
     * @param username the username
     * @return the JWT access token
     */
    public String generateAccessToken(final String username) {
        return Jwts.builder()
            .subject(username)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
            .signWith(key)
            .compact();
    }

    /**
     * Generates a JWT refresh token for the given username.
     *
     * @param username the username
     * @return the JWT refresh token
     */
    public String generateRefreshToken(final String username) {
        return Jwts.builder()
            .subject(username)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION_TIME))
            .signWith(key)
            .compact();
    }

    /**
     * Extracts the username from a JWT token.
     *
     * @param token the JWT token
     * @return the username
     */
    public String extractUsername(final String token) {
        final Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.getSubject();
    }

    /**
     * Validates a JWT token.
     *
     * @param token the JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(final String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (final Exception e) {
            return false;
        }
    }
}
