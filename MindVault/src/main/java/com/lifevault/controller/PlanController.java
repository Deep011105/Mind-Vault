package com.lifevault.controller;

import com.lifevault.dto.DailyPlanResponse;
import com.lifevault.service.DailyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final DailyPlanService planService;

    @GetMapping("/today")
    public ResponseEntity<DailyPlanResponse> getTodaysPlan() {
        DailyPlanResponse plan = planService.getTodaysPlan();
        if (plan == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/history")
    public ResponseEntity<List<DailyPlanResponse>> getPlanHistory() {
        return ResponseEntity.ok(planService.getPlanHistory());
    }

    @PostMapping("/generate")
    public ResponseEntity<DailyPlanResponse> generateNextPlan() {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.generateNextPlan());
    }

    @GetMapping("/{dateStr}")
    public ResponseEntity<DailyPlanResponse> getPlanByDate(@PathVariable String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            return ResponseEntity.ok(planService.getPlanByDate(date));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
