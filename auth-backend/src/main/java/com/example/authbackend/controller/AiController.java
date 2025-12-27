package com.example.authbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Simple placeholder AI endpoints for feedback generation.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    @PostMapping("/feedback")
    public ResponseEntity<?> feedback(@RequestParam("path") String path, @RequestBody String instructions) {
        // Simple placeholder response: message.content is a JSON string that the frontend will parse
        final String payload = "{\"score\": 85, \"comments\": \"This is sample feedback\"}";
        return ResponseEntity.ok().body(java.util.Map.of("message", java.util.Map.of("content", payload)));
    }
}