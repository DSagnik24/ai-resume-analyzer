package com.example.authbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory key-value store for demo purposes.
 */
@RestController
@RequestMapping("/api/kv")
public class KVController {

    private final Map<String, String> store = new ConcurrentHashMap<>();

    @PostMapping("/{key}")
    public ResponseEntity<?> set(@PathVariable String key, @RequestBody String body) {
        store.put(key, body);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{key}")
    public ResponseEntity<String> get(@PathVariable String key) {
        final String v = store.get(key);
        if (v == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(v);
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<?> delete(@PathVariable String key) {
        store.remove(key);
        return ResponseEntity.ok().build();
    }
}