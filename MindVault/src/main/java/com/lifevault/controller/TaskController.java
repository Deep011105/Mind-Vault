package com.lifevault.controller;

import com.lifevault.dto.TaskStatusUpdateRequest;
import com.lifevault.service.DailyPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final DailyPlanService planService;

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TaskStatusUpdateRequest request) {
        planService.updateTaskStatus(id, request);
        return ResponseEntity.noContent().build();
    }
}
