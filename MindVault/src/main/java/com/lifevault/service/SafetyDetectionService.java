package com.lifevault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * A quantized local 7B model has none of the safety training larger hosted
 * models get around self-harm/crisis language, so this check runs BEFORE the
 * LLM ever sees the message, deterministically, and bypasses the LLM entirely
 * if triggered. Do not route crisis handling through the model.
 */
@Service
public class SafetyDetectionService {

    // Deliberately simple pattern-level matching, not exhaustive NLP. False
    // positives are the acceptable failure mode here — worst case the user
    // sees a supportive message with resources when they didn't strictly need
    // it. False negatives are the failure mode to minimize.
    private static final List<Pattern> CRISIS_PATTERNS = List.of(
            Pattern.compile("\\b(kill|hurt|harm)\\s+myself\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bend(ing)?\\s+my\\s+life\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bsuicid(e|al)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bwant(ing)?\\s+to\\s+die\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bself[\\s-]?harm\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bno\\s+reason\\s+to\\s+live\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bcan'?t\\s+go\\s+on\\s+(living|anymore)\\b", Pattern.CASE_INSENSITIVE)
    );

    @Value("${app.crisis.helpline-text}")
    private String helplineText;

    public boolean containsCrisisLanguage(String text) {
        if (text == null || text.isBlank()) return false;
        return CRISIS_PATTERNS.stream().anyMatch(p -> p.matcher(text).find());
    }

    public String buildCrisisResponse() {
        return """
                I'm really glad you told me this, and I want to take it seriously rather than \
                just try to talk you through it myself.

                %s

                If you feel able to, please also reach out to someone you trust — a friend, \
                family member, or doctor — so you don't have to carry this alone right now. \
                I'm here if you want to keep talking too.
                """.formatted(helplineText.trim());
    }
}
