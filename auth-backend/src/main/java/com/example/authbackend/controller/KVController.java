package com.example.authbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

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

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> list(
        @RequestParam(defaultValue = "*") String pattern,
        @RequestParam(defaultValue = "true") boolean returnValues) {

        final Pattern regex = Pattern.compile(
            "^" + Pattern.quote(pattern).replace("\\*", ".*") + "$"
        );

        final List<Map<String, String>> items = store.entrySet().stream()
            .filter(entry -> regex.matcher(entry.getKey()).matches())
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> returnValues
                ? Map.of("key", entry.getKey(), "value", entry.getValue())
                : Map.of("key", entry.getKey()))
            .toList();

        return ResponseEntity.ok(items);
    }

    @DeleteMapping
    public ResponseEntity<?> flush() {
        store.clear();
        return ResponseEntity.ok().build();
    }
}
