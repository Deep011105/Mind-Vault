package com.lifevault.service;

import com.lifevault.dto.CreateJournalRequest;
import com.lifevault.dto.JournalResponse;
import com.lifevault.dto.UpdateJournalRequest;
import com.lifevault.entity.JournalEntry;
import com.lifevault.event.JournalCreatedEvent;
import com.lifevault.event.JournalDeletedEvent;
import com.lifevault.event.JournalUpdatedEvent;
import com.lifevault.repository.JournalEntryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.UUID;

@Service
public class JournalService {

    private final JournalEntryRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    public JournalService(JournalEntryRepository repository, ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public JournalResponse create(CreateJournalRequest request) {
        Instant now = Instant.now();
        LocalDate date = LocalDate.ofInstant(now, ZoneId.systemDefault());

        JournalEntry entry = new JournalEntry();
        entry.setContent(request.content());
        entry.setMood(request.mood());
        entry.setStress(request.stress());
        entry.setEnergy(request.energy());
        entry.setWordCount(countWords(request.content()));
        entry.setDayOfWeek(date.getDayOfWeek().toString());
        entry.setWeekNumber(date.get(WeekFields.ISO.weekOfWeekBasedYear()));
        entry.setMonth(date.getMonthValue());
        entry.setYear(date.getYear());
        entry.setCreatedAt(now);
        entry.setUpdatedAt(now);

        JournalEntry saved = repository.save(entry);

        // JournalEmbeddingListener adds this entry to the vector store, and
        // ProfileSummaryService folds it into the long-term running summary.
        eventPublisher.publishEvent(new JournalCreatedEvent(
                saved.getId(), saved.getContent(), saved.getMood(), saved.getCreatedAt()));

        return JournalResponse.from(saved);
    }

    @Transactional
    public JournalResponse update(UUID id, UpdateJournalRequest request) {
        JournalEntry entry = repository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Journal not found: " + id));

        entry.setContent(request.content());
        entry.setMood(request.mood());
        entry.setStress(request.stress());
        entry.setEnergy(request.energy());
        entry.setWordCount(countWords(request.content()));
        entry.setUpdatedAt(Instant.now());

        JournalEntry saved = repository.save(entry);

        // Distinct event type — the embedding listener needs to know this is a
        // re-embed, not a fresh embed, so it deletes the old vector(s) first.
        eventPublisher.publishEvent(new JournalUpdatedEvent(
                saved.getId(), saved.getContent(), saved.getMood(), saved.getUpdatedAt()));

        return JournalResponse.from(saved);
    }

    @Transactional
    public void delete(UUID id) {
        JournalEntry entry = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Journal not found: " + id));
        entry.setDeletedAt(Instant.now());
        repository.save(entry);

        // So the embedding listener can remove the corresponding vector(s) too —
        // otherwise a "deleted" entry could still surface in semantic retrieval.
        eventPublisher.publishEvent(new JournalDeletedEvent(entry.getId()));
    }

    public List<JournalResponse> listAll() {
        return repository.findByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream().map(JournalResponse::from).toList();
    }

    public JournalResponse getById(UUID id) {
        JournalEntry entry = repository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new EntityNotFoundException("Journal not found: " + id));
        return JournalResponse.from(entry);
    }

    /** Raw entities (not DTOs) for the memory context builder / PDF export, which need full data. */
    public List<JournalEntry> recentRaw(int count) {
        return repository.findByDeletedAtIsNullOrderByCreatedAtDesc(PageRequest.of(0, count));
    }

    private int countWords(String content) {
        return content.isBlank() ? 0 : content.trim().split("\\s+").length;
    }
}
