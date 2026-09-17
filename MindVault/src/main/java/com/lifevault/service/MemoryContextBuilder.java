package com.lifevault.service;

import com.lifevault.entity.JournalEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Builds the memory block injected into the chat prompt, combining three layers:
 *   1. Recency buffer   — last N entries in full, for conversational continuity.
 *   2. Semantic search  — top-k entries most relevant to *this* message, regardless
 *                          of age (catches "same stressor as 3 months ago" cases the
 *                          recency window alone would miss).
 *   3. Profile summary  — a small, continuously-updated long-term memory doc.
 *
 * Cold start (no entries, or very few/short ones) is treated as a normal, valid
 * state — never an error. The chain simply degrades to "less context available".
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemoryContextBuilder {

    private final JournalService journalService;
    private final ProfileSummaryService profileSummaryService;
    private final VectorStore vectorStore;
    private final DailyPlanService dailyPlanService;

    @Value("${app.rag.recency-buffer-size:4}")
    private int recencyBufferSize;

    @Value("${app.rag.top-k:5}")
    private int topK;

    public MemoryContext build(String currentUserMessage) {
        List<JournalEntry> recent = journalService.recentRaw(recencyBufferSize);

        if (recent.isEmpty()) {
            return new MemoryContext(
                    """
                    ## Long-term profile
                    No journal history yet — this is a brand new user with nothing recorded so far.

                    ## Recent entries
                    (none yet)
                    """,
                    true
            );
        }

        Set<String> recentIds = new LinkedHashSet<>();
        StringBuilder recencyBlock = new StringBuilder();
        for (JournalEntry e : recent) {
            recentIds.add(e.getId().toString());
            recencyBlock.append("- [%s, mood: %s] %s%n".formatted(
                    e.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                    e.getMood(),
                    e.getContent()));
        }

        String semanticBlock = "(nothing additional found)";
        try {
            List<Document> hits = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(currentUserMessage)
                            .topK(topK + recent.size()) // over-fetch, then filter out recency overlap
                            .build()
            );

            if (hits != null && !hits.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                int used = 0;
                for (Document d : hits) {
                    Object jid = d.getMetadata().get("journalId");
                    if (jid != null && recentIds.contains(jid.toString())) {
                        continue; // already covered by the recency buffer, skip duplicate
                    }
                    Object date = d.getMetadata().getOrDefault("date", "unknown date");
                    Object mood = d.getMetadata().getOrDefault("mood", "UNKNOWN");
                    sb.append("- [%s, mood: %s] %s%n".formatted(date, mood, d.getText()));
                    used++;
                    if (used >= topK) break;
                }
                if (used > 0) {
                    semanticBlock = sb.toString();
                }
            }
        } catch (Exception e) {
            // If retrieval fails, the chat should still work off recency + profile —
            // never let a vector-store hiccup break the whole conversation.
            log.warn("Semantic retrieval failed; continuing with recency buffer + profile only", e);
        }

        String planningBlock = "(no plan for today)";
        try {
            var todayPlan = dailyPlanService.getTodaysPlan();
            if (todayPlan != null && !todayPlan.tasks().isEmpty()) {
                StringBuilder pb = new StringBuilder();
                pb.append(String.format("Completion: %s%%\n", todayPlan.completionPercent() != null ? todayPlan.completionPercent() : "0"));
                for (var t : todayPlan.tasks()) {
                    pb.append(String.format("- [%s] %s (Priority: %s)\n", t.status(), t.title(), t.priority()));
                }
                planningBlock = pb.toString();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch today's plan for memory context", e);
        }

        String block = """
                ## Long-term profile (recurring themes, goals, coping patterns)
                %s

                ## Today's Plan
                %s

                ## Most recent entries (full text)
                %s

                ## Other potentially relevant past entries (semantic match)
                %s
                """.formatted(profileSummaryService.getCurrentSummaryText(), planningBlock, recencyBlock, semanticBlock);

        return new MemoryContext(block, false);
    }

    public record MemoryContext(String promptBlock, boolean coldStart) {}
}
