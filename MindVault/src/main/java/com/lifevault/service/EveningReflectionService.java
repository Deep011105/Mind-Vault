package com.lifevault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifevault.dto.ReflectionRequest;
import com.lifevault.dto.ReflectionResponse;
import com.lifevault.entity.DailyPlan;
import com.lifevault.entity.JournalEntry;
import com.lifevault.repository.DailyPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EveningReflectionService {

    private final DailyPlanRepository planRepository;
    private final InsightService insightService;
    private final DailyPlanService planService;
    private final JournalService journalService;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    private static final String REFLECTION_PROMPT = """
            You are a supportive personal AI coach. The user is doing their evening reflection on today's tasks.
            Analyze their reflection text and extract structured information.

            Return ONLY a valid JSON object matching this structure:
            {
              "aiResponse": "A short, encouraging 2-sentence response to their reflection.",
              "skippedReasonsExtracted": ["reason 1", "reason 2"],
              "keyLearning": "One sentence describing what we can learn for tomorrow's plan."
            }
            """;

    @Transactional
    public ReflectionResponse processReflection(ReflectionRequest req) {
        DailyPlan todayPlan = planRepository.findByPlanDate(LocalDate.now())
                .orElse(null);

        if (todayPlan == null) {
            log.warn("Evening reflection submitted but no plan exists for today.");
        }

        String response;
        try {
            response = chatClient.prompt()
                    .system(REFLECTION_PROMPT)
                    .user("User's reflection:\n" + req.reflectionText())
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Local LLM call failed during reflection processing", e);
            return new ReflectionResponse(
                    "I couldn't reach the local AI model just now, but your reflection is safe — please try again in a moment.",
                    List.of(), "No key learning extracted (AI unavailable).");
        }

        String jsonPart = extractJsonObject(response);

        ReflectionResponse result;
        try {
            JsonNode root = objectMapper.readTree(jsonPart);
            List<String> reasons = new ArrayList<>();
            if (root.has("skippedReasonsExtracted") && root.get("skippedReasonsExtracted").isArray()) {
                root.get("skippedReasonsExtracted").forEach(n -> reasons.add(n.asText()));
            }
            result = new ReflectionResponse(
                    root.path("aiResponse").asText(),
                    reasons,
                    root.path("keyLearning").asText()
            );

            if (todayPlan != null) {
                todayPlan.setAiReflection(result.keyLearning());

                // overallMood was never being populated anywhere despite being part of
                // the intended planning context (mood/stress/energy feeding tomorrow's
                // plan) — derive it from today's most recent journal entry, if any.
                journalService.recentRaw(1).stream()
                        .filter(e -> e.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(LocalDate.now()))
                        .findFirst()
                        .ifPresent(e -> todayPlan.setOverallMood(e.getMood()));

                planRepository.save(todayPlan);
            }

            // Trigger insight updates based on new data
            insightService.updateInsights();

            // Auto-generate the next plan now that reflection is complete
            try {
                planService.generateNextPlan();
            } catch (Exception e) {
                log.error("Failed to auto-generate the next plan after reflection", e);
            }

        } catch (Exception e) {
            log.error("Failed to parse reflection JSON: {}", jsonPart, e);
            result = new ReflectionResponse("Thanks for sharing. I'll keep this in mind.", List.of(), "No key learning extracted.");
        }

        return result;
    }

    /**
     * Same tolerant extraction approach as DailyPlanService: strip markdown fences
     * if present, then fall back to the substring between the first '{' and the
     * last '}' — local models don't always follow "return ONLY JSON" exactly.
     */
    private String extractJsonObject(String response) {
        if (response == null) return "{}";
        String trimmed = response.trim();

        if (trimmed.contains("```")) {
            int start = trimmed.indexOf("```");
            int contentStart = trimmed.startsWith("```json", start) ? start + 7 : start + 3;
            int end = trimmed.indexOf("```", contentStart);
            if (end != -1) {
                trimmed = trimmed.substring(contentStart, end).trim();
            }
        }

        int objStart = trimmed.indexOf('{');
        int objEnd = trimmed.lastIndexOf('}');
        if (objStart != -1 && objEnd != -1 && objEnd > objStart) {
            trimmed = trimmed.substring(objStart, objEnd + 1);
        }

        return trimmed;
    }
}
