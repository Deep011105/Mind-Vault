package com.lifevault.service;

import com.lifevault.entity.Mood;
import com.lifevault.entity.UserProfileSummary;
import com.lifevault.repository.UserProfileSummaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Maintains ONE running summary document instead of re-compressing the entire
 * journal history on every request. Updating it is a cheap "merge new info in"
 * LLM call, not a re-summarization of everything — that's what makes this scale
 * on a small local model.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileSummaryService {

    private static final String DEFAULT_SUMMARY =
            "No profile built yet — this user hasn't written enough journal entries " +
            "for any recurring patterns to be identified.";

    // Skip the LLM call for very short/low-signal entries — not worth the cost
    // or the risk of the model inventing a "pattern" from one sentence.
    private static final int MIN_WORDS_TO_UPDATE_PROFILE = 15;

    private final UserProfileSummaryRepository repository;
    private final ChatClient chatClient;

    public String getCurrentSummaryText() {
        return repository.findFirstByOrderByUpdatedAtDesc()
                .map(UserProfileSummary::getSummaryText)
                .orElse(DEFAULT_SUMMARY);
    }

    public void incorporateNewEntry(String newEntryContent, Mood mood) {
        if (newEntryContent == null || countWords(newEntryContent) < MIN_WORDS_TO_UPDATE_PROFILE) {
            return;
        }

        UserProfileSummary current = repository.findFirstByOrderByUpdatedAtDesc()
                .orElseGet(() -> UserProfileSummary.builder()
                        .id(UUID.randomUUID())
                        .summaryText(DEFAULT_SUMMARY)
                        .entriesIncorporated(0)
                        .build());

        String existing = current.getEntriesIncorporated() == 0 ? "(none yet)" : current.getSummaryText();

        String prompt = """
                You maintain a short, running private profile of a journaling user, used only
                to give a supportive companion useful context. Update the profile below to
                incorporate the new entry. Do not restart from scratch — merge, refine, and
                drop anything no longer relevant.

                Keep it under 200 words, plain prose, covering only what is actually evidenced
                by the entries: recurring stressors or themes, goals mentioned, coping
                strategies that have helped, and the user's general tone/communication style.
                Do not speculate beyond what is written. Do not include advice or commentary —
                this is a factual memory summary, not a response to the user.

                Current profile:
                %s

                New journal entry (mood: %s):
                %s

                Updated profile:
                """.formatted(existing, mood == null ? "UNKNOWN" : mood.name(), newEntryContent);

        try {
            String updated = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            if (updated != null && !updated.isBlank()) {
                current.setSummaryText(updated.trim());
                current.setEntriesIncorporated(current.getEntriesIncorporated() + 1);
                repository.save(current);
            }
        } catch (Exception e) {
            // Best-effort enrichment — never let this block or corrupt the main flow.
            log.warn("Failed to update profile summary; keeping previous version", e);
        }
    }

    private int countWords(String text) {
        return text.isBlank() ? 0 : text.trim().split("\\s+").length;
    }
}
