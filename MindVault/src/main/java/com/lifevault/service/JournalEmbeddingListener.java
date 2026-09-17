package com.lifevault.service;

import com.lifevault.entity.Mood;
import com.lifevault.event.JournalCreatedEvent;
import com.lifevault.event.JournalDeletedEvent;
import com.lifevault.event.JournalUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Keeps pgvector in sync with journal entries, and triggers the long-term
 * profile summary update. Journal entries are usually short, so most of the
 * time this indexes ONE document per entry (id = journalId) — chunking only
 * kicks in for unusually long entries, avoiding the "empty/garbage retrieval
 * on a short entry" failure mode.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JournalEmbeddingListener {

    private static final int CHUNK_THRESHOLD_CHARS = 1500;

    private final VectorStore vectorStore;
    private final ProfileSummaryService profileSummaryService;
    private final TokenTextSplitter splitter = new TokenTextSplitter();

    @Async
    @EventListener
    public void onCreated(JournalCreatedEvent event) {
        indexEntry(event.journalId(), event.content(), event.mood(), event.createdAt());
        profileSummaryService.incorporateNewEntry(event.content(), event.mood());
    }

    @Async
    @EventListener
    public void onUpdated(JournalUpdatedEvent event) {
        // Re-embed: delete whatever vectors existed for this entry first,
        // otherwise the old (stale) content stays retrievable forever.
        deleteVectorsForJournal(event.journalId());
        indexEntry(event.journalId(), event.content(), event.mood(), event.updatedAt());
        profileSummaryService.incorporateNewEntry(event.content(), event.mood());
    }

    @Async
    @EventListener
    public void onDeleted(JournalDeletedEvent event) {
        deleteVectorsForJournal(event.journalId());
    }

    private void indexEntry(UUID journalId, String content, Mood mood, Instant createdAt) {
        if (content == null || content.isBlank()) {
            log.info("Skipping embedding for empty journal {}", journalId);
            return;
        }

        String dateStr = createdAt == null
                ? ""
                : createdAt.atZone(ZoneId.systemDefault()).toLocalDate().toString();

        Map<String, Object> baseMetadata = Map.of(
                "journalId", journalId.toString(),
                "mood", mood == null ? "UNKNOWN" : mood.name(),
                "date", dateStr
        );

        try {
            List<Document> toIndex;
            if (content.length() <= CHUNK_THRESHOLD_CHARS) {
                toIndex = List.of(Document.builder()
                        .id(journalId.toString())
                        .text(content)
                        .metadata(baseMetadata)
                        .build());
            } else {
                Document full = Document.builder().text(content).metadata(baseMetadata).build();
                List<Document> chunks = splitter.apply(List.of(full));
                toIndex = chunks.stream().map(chunk -> Document.builder()
                                .id(journalId + "::" + chunk.getId())
                                .text(chunk.getText())
                                .metadata(baseMetadata)
                                .build())
                        .toList();
            }
            vectorStore.add(toIndex);
            log.info("Indexed {} vector chunk(s) for journal {}", toIndex.size(), journalId);
        } catch (Exception e) {
            // Embedding failure should never block journaling itself — the entry is
            // already safely persisted in Postgres regardless of what happens here.
            log.error("Failed to embed journal {} — entry is still saved, just not searchable yet", journalId, e);
        }
    }

    private void deleteVectorsForJournal(UUID journalId) {
        try {
            var b = new FilterExpressionBuilder();
            var filter = b.eq("journalId", journalId.toString());
            vectorStore.delete(filter.build());
        } catch (Exception e) {
            log.warn("Failed to delete previous vectors for journal {} — proceeding anyway", journalId, e);
        }
    }
}
