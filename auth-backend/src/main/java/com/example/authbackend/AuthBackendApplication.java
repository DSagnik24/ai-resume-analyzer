package com.example.authbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Auth Backend Spring Boot application.
 */
@SpringBootApplication
public class AuthBackendApplication {
    /**
     * Default constructor.
     */
    public AuthBackendApplication() {
        // Default constructor for Spring
    }

    /**
     * Main method to start the Spring Boot application.
     *
     * @param args the command-line arguments (typically empty)
     */
    public static void main(final String[] args) {
        SpringApplication.run(AuthBackendApplication.class, args);
    }
}
