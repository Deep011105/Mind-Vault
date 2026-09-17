package com.lifevault.controller;

import com.lifevault.dto.ReflectionRequest;
import com.lifevault.dto.ReflectionResponse;
import com.lifevault.service.EveningReflectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reflection")
@RequiredArgsConstructor
public class ReflectionController {

    private final EveningReflectionService reflectionService;

    @PostMapping("/today")
    public ResponseEntity<ReflectionResponse> submitEveningReflection(
            @Valid @RequestBody ReflectionRequest request) {
        return ResponseEntity.ok(reflectionService.processReflection(request));
    }
}
