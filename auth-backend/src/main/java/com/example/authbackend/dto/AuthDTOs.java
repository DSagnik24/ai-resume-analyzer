package com.example.authbackend.dto;

import java.io.Serializable;

/**
 * DTO for authentication requests and responses.
 */
public class AuthDTOs {

    /**
     * DTO for authentication response containing user and tokens.
     */
    public static class AuthResponse implements Serializable {
        private static final long serialVersionUID = 1L;

        private UserDTO user;
        private String accessToken;
        private String refreshToken;

        /**
         * Default constructor.
         */
        public AuthResponse() {
        }

        /**
         * Constructor with all fields.
         *
         * @param user the user DTO
         * @param accessToken the access token
         * @param refreshToken the refresh token
         */
        public AuthResponse(final UserDTO user, final String accessToken, final String refreshToken) {
            this.user = user;
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
        }

        /**
         * Gets the user DTO.
         *
         * @return the user DTO
         */
        public UserDTO getUser() {
            return user;
        }

        /**
         * Sets the user DTO.
         *
         * @param user the user DTO
         */
        public void setUser(final UserDTO user) {
            this.user = user;
        }

        /**
         * Gets the access token.
         *
         * @return the access token
         */
        public String getAccessToken() {
            return accessToken;
        }

        /**
         * Sets the access token.
         *
         * @param accessToken the access token
         */
        public void setAccessToken(final String accessToken) {
            this.accessToken = accessToken;
        }

        /**
         * Gets the refresh token.
         *
         * @return the refresh token
         */
        public String getRefreshToken() {
            return refreshToken;
        }

        /**
         * Sets the refresh token.
         *
         * @param refreshToken the refresh token
         */
        public void setRefreshToken(final String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }

    /**
     * DTO for user information.
     */
    public static class UserDTO implements Serializable {
        private static final long serialVersionUID = 1L;

        private String id;
        private String username;
        private String email;

        /**
         * Default constructor.
         */
        public UserDTO() {
        }

        /**
         * Constructor with all fields.
         *
         * @param id the user ID
         * @param username the username
         * @param email the email
         */
        public UserDTO(final String id, final String username, final String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }

        /**
         * Gets the user ID.
         *
         * @return the user ID
         */
        public String getId() {
            return id;
        }

        /**
         * Sets the user ID.
         *
         * @param id the user ID
         */
        public void setId(final String id) {
            this.id = id;
        }

        /**
         * Gets the username.
         *
         * @return the username
         */
        public String getUsername() {
            return username;
        }

        /**
         * Sets the username.
         *
         * @param username the username
         */
        public void setUsername(final String username) {
            this.username = username;
        }

        /**
         * Gets the email.
         *
         * @return the email
         */
        public String getEmail() {
            return email;
        }

        /**
         * Sets the email.
         *
         * @param email the email
         */
        public void setEmail(final String email) {
            this.email = email;
        }
    }

    /**
     * DTO for login requests.
     */
    public static class LoginRequest implements Serializable {
        private static final long serialVersionUID = 1L;

        private String username;
        private String password;

        /**
         * Default constructor.
         */
        public LoginRequest() {
        }

        /**
         * Constructor with all fields.
         *
         * @param username the username
         * @param password the password
         */
        public LoginRequest(final String username, final String password) {
            this.username = username;
            this.password = password;
        }

        /**
         * Gets the username.
         *
         * @return the username
         */
        public String getUsername() {
            return username;
        }

        /**
         * Sets the username.
         *
         * @param username the username
         */
        public void setUsername(final String username) {
            this.username = username;
        }

        /**
         * Gets the password.
         *
         * @return the password
         */
        public String getPassword() {
            return password;
        }

        /**
         * Sets the password.
         *
         * @param password the password
         */
        public void setPassword(final String password) {
            this.password = password;
        }
    }
}
