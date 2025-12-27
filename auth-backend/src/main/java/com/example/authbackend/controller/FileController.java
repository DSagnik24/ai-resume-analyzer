package com.example.authbackend.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Controller for file upload and serving.
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath();

    public FileController() throws IOException {
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            final String original = StringUtils.cleanPath(file.getOriginalFilename());
            final String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            final String filename = UUID.randomUUID().toString() + ext;

            final Path target = this.uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target);

            final String publicPath = "/api/files/" + filename;
            return ResponseEntity.ok().body(java.util.Map.of(
                "name", original,
                "path", publicPath,
                "size", file.getSize()
            ));
        } catch (final IOException e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Failed to upload file"));
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            final Path file = uploadDir.resolve(filename).normalize();
            final Resource resource = new UrlResource(file.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            final String contentType = Files.probeContentType(file);
            return ResponseEntity.ok()
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } catch (final MalformedURLException e) {
            return ResponseEntity.status(500).build();
        } catch (final IOException e) {
            return ResponseEntity.status(500).build();
        }
    }
}