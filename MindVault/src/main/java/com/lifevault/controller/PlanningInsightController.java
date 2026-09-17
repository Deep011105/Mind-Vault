package com.lifevault.controller;

import com.lifevault.dto.AiInsightResponse;
import com.lifevault.entity.AiInsight;
import com.lifevault.repository.AiInsightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/insights/planning")
@RequiredArgsConstructor
public class PlanningInsightController {

    private final AiInsightRepository insightRepository;

    @GetMapping
    public ResponseEntity<List<AiInsightResponse>> getPlanningInsights() {
        List<AiInsightResponse> insights = insightRepository.findAllByOrderByGeneratedAtDesc()
                .stream()
                .map(i -> new AiInsightResponse(
                        i.getId(),
                        i.getType(),
                        i.getDescription(),
                        i.getConfidence(),
                        i.getGeneratedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(insights);
    }
}
