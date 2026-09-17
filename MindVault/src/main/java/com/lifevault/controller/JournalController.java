package com.lifevault.controller;

import com.lifevault.dto.CreateJournalRequest;
import com.lifevault.dto.JournalResponse;
import com.lifevault.dto.UpdateJournalRequest;
import com.lifevault.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    public ResponseEntity<JournalResponse> create(@Valid @RequestBody CreateJournalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(journalService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JournalResponse> update(@PathVariable UUID id,
                                                    @Valid @RequestBody UpdateJournalRequest request) {
        return ResponseEntity.ok(journalService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        journalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<JournalResponse>> listAll() {
        return ResponseEntity.ok(journalService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JournalResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(journalService.getById(id));
    }
}
