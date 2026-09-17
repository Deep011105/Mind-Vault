package com.lifevault.controller;

import com.lifevault.dto.MoodStatsResponse;
import com.lifevault.service.MoodStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/moods")
@RequiredArgsConstructor
public class MoodController {

    private final MoodStatsService moodStatsService;

    @GetMapping("/stats")
    public ResponseEntity<MoodStatsResponse> stats() {
        return ResponseEntity.ok(moodStatsService.getStats());
    }
}
