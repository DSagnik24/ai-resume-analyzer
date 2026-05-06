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
        // Local deterministic feedback keeps the full upload-review flow working without an external AI key.
        final String payload = """
            {
              "overallScore": 78,
              "ATS": {
                "score": 82,
                "tips": [
                  { "type": "good", "tip": "Resume uses a readable structure for ATS parsing." },
                  { "type": "improve", "tip": "Add more job-description keywords where they fit naturally." },
                  { "type": "improve", "tip": "Use standard section headings such as Experience, Skills, and Education." }
                ]
              },
              "toneAndStyle": {
                "score": 76,
                "tips": [
                  { "type": "good", "tip": "Professional tone", "explanation": "The resume reads clearly and avoids overly casual wording." },
                  { "type": "improve", "tip": "Tighten bullets", "explanation": "Make bullets more direct by starting with strong action verbs and removing filler words." },
                  { "type": "improve", "tip": "Show confidence", "explanation": "Replace vague phrases with concrete achievements and measurable outcomes." }
                ]
              },
              "content": {
                "score": 74,
                "tips": [
                  { "type": "good", "tip": "Relevant experience is present", "explanation": "The resume includes work history that can be connected to the target role." },
                  { "type": "improve", "tip": "Quantify impact", "explanation": "Add numbers, percentages, scale, or business outcomes to make accomplishments easier to evaluate." },
                  { "type": "improve", "tip": "Mirror the role", "explanation": "Prioritize experience and projects that match the job title and description." }
                ]
              },
              "structure": {
                "score": 80,
                "tips": [
                  { "type": "good", "tip": "Clear sections", "explanation": "The document can be scanned quickly by a recruiter." },
                  { "type": "improve", "tip": "Improve hierarchy", "explanation": "Keep titles, companies, locations, and dates visually consistent throughout." },
                  { "type": "improve", "tip": "Limit dense blocks", "explanation": "Break long text into short accomplishment-focused bullets." }
                ]
              },
              "skills": {
                "score": 78,
                "tips": [
                  { "type": "good", "tip": "Skills are visible", "explanation": "The resume gives recruiters a quick view of relevant tools and abilities." },
                  { "type": "improve", "tip": "Group skills", "explanation": "Separate languages, frameworks, tools, and domain skills for easier ATS matching." },
                  { "type": "improve", "tip": "Connect skills to achievements", "explanation": "Mention important skills again inside experience bullets to prove applied capability." }
                ]
              }
            }
            """;
        return ResponseEntity.ok().body(java.util.Map.of("message", java.util.Map.of("content", payload)));
    }
}
