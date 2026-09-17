package com.lifevault.controller;

import com.lifevault.entity.JournalEntry;
import com.lifevault.repository.JournalEntryRepository;
import com.lifevault.service.PdfExportService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final JournalEntryRepository journalEntryRepository;
    private final PdfExportService pdfExportService;

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> exportOne(@PathVariable UUID id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Journal not found: " + id));

        byte[] pdf = pdfExportService.exportEntries(List.of(entry), "MindVault — Journal Entry");
        return pdfResponse(pdf, "mindvault-entry-" + id + ".pdf");
    }

    @GetMapping("/range")
    public ResponseEntity<byte[]> exportRange(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        ZoneId zone = ZoneId.systemDefault();
        Instant fromInstant = from.atStartOfDay(zone).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(zone).toInstant();

        List<JournalEntry> entries = journalEntryRepository
                .findByDeletedAtIsNullAndCreatedAtBetween(fromInstant, toInstant);

        byte[] pdf = pdfExportService.exportEntries(entries, "MindVault — Journal Export (%s to %s)".formatted(from, to));
        return pdfResponse(pdf, "mindvault-export-%s-to-%s.pdf".formatted(from, to));
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return new ResponseEntity<>(pdf, headers, org.springframework.http.HttpStatus.OK);
    }
}
