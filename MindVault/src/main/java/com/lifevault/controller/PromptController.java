package com.lifevault.controller;

import com.lifevault.dto.DailyPromptResponse;
import com.lifevault.service.DailyPromptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptController {

    private final DailyPromptService dailyPromptService;

    @GetMapping("/today")
    public ResponseEntity<DailyPromptResponse> today() {
        return ResponseEntity.ok(dailyPromptService.getTodayPrompt());
    }
}
