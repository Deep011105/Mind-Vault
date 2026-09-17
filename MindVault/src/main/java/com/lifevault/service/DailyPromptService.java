package com.lifevault.service;

import com.lifevault.dto.DailyPromptResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyPromptService {

    private static final List<String> FALLBACK_PROMPTS = List.of(
            "What's one thing that took up more mental energy than it deserved today?",
            "Where did you procrastinate today, and what do you think you were avoiding?",
            "What's one small thing that actually went well today?",
            "If tomorrow went better than today, what would be different?",
            "What's weighing on you right now that you haven't said out loud?",
            "What did you get done today that you're proud of, even if it's small?",
            "Is there a conversation you're avoiding? What's stopping you?",
            "What would 'enough' have looked like today?"
    );

    private final ProfileSummaryService profileSummaryService;
    private final ChatClient chatClient;

    public DailyPromptResponse getTodayPrompt() {
        String profile = profileSummaryService.getCurrentSummaryText();
        boolean hasProfile = profile != null && !profile.startsWith("No profile built yet");

        if (!hasProfile) {
            return new DailyPromptResponse(fallback(), false);
        }

        try {
            String prompt = """
                    Based on this private user profile, write exactly ONE short, warm journaling
                    prompt/question (max 25 words) relevant to their recurring themes. Output only
                    the question, nothing else.

                    Profile:
                    %s
                    """.formatted(profile);

            String generated = chatClient.prompt().user(prompt).call().content();
            if (generated != null && !generated.isBlank()) {
                return new DailyPromptResponse(generated.trim(), true);
            }
        } catch (Exception e) {
            log.warn("Personalized prompt generation failed, using fallback", e);
        }

        return new DailyPromptResponse(fallback(), false);
    }

    private String fallback() {
        int index = LocalDate.now().getDayOfYear() % FALLBACK_PROMPTS.size();
        return FALLBACK_PROMPTS.get(index);
    }
}
