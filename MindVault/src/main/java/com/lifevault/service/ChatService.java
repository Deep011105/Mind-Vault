package com.lifevault.service;

import com.lifevault.entity.ChatMessage;
import com.lifevault.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    // This is the key fix vs. the old RAG chain: the model is told it's a
    // conversational companion that MAY use retrieved memory, not a document-QA
    // bot restricted to only what's retrieved. It's also explicitly told this
    // isn't clinical care, and how to behave with little/no history.
    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are the reflective companion inside MindVault, a private local journaling app.
            You help the user process their day, think through stress, workload, procrastination,
            and emotions, and gently support better daily habits and planning.

            You are a supportive companion, not a licensed therapist — you can offer perspective,
            reflection, and practical suggestions, but for anything clinical or urgent, encourage
            the user to involve a real professional or someone they trust.

            You have some background memory about the user below. Use it when it's actually
            relevant, but you are NOT restricted to it — think, reason, and give advice using
            your own judgment just like a normal conversation. If the memory below is sparse or
            empty (e.g. a brand new user), that's completely fine — just have a warm, normal
            conversation and get to know them; never refuse to respond or say you lack information.

            %s
            """;

    private final ChatMessageRepository chatMessageRepository;
    private final MemoryContextBuilder memoryContextBuilder;
    private final SafetyDetectionService safetyDetectionService;
    private final ChatClient chatClient;

    @Value("${app.chat.history-turns-in-context:6}")
    private int historyTurnsInContext;

    @Transactional
    public ChatMessage handleUserMessage(String userText) {
        saveMessage(ChatMessage.ChatRole.USER, userText, false);

        if (safetyDetectionService.containsCrisisLanguage(userText)) {
            String crisisReply = safetyDetectionService.buildCrisisResponse();
            return saveMessage(ChatMessage.ChatRole.ASSISTANT, crisisReply, true);
        }

        MemoryContextBuilder.MemoryContext memory = memoryContextBuilder.build(userText);
        String systemPrompt = SYSTEM_PROMPT_TEMPLATE.formatted(memory.promptBlock());

        List<Message> priorTurns = loadRecentChatHistory();

        String answer;
        try {
            answer = chatClient.prompt()
                    .system(systemPrompt)
                    .messages(priorTurns)
                    .user(userText)
                    .call()
                    .content();

            if (answer == null || answer.isBlank()) {
                answer = "I'm having trouble putting a response together right now — could you try rephrasing that?";
            }
        } catch (Exception e) {
            log.error("Local LLM call failed", e);
            answer = "I couldn't reach the local AI model just now. Your message was saved — " +
                      "please make sure the local model is running and try again.";
        }

        return saveMessage(ChatMessage.ChatRole.ASSISTANT, answer, false);
    }

    public List<ChatMessage> history() {
        return chatMessageRepository.findAllByOrderByCreatedAtAsc();
    }

    private List<Message> loadRecentChatHistory() {
        // Exclude the message we just saved (it's added separately via .user()).
        List<ChatMessage> recentDesc = chatMessageRepository.findByOrderByCreatedAtDesc(
                PageRequest.of(0, historyTurnsInContext + 1));

        List<ChatMessage> ordered = new ArrayList<>(recentDesc);
        Collections.reverse(ordered);
        if (!ordered.isEmpty()) {
            ordered.remove(ordered.size() - 1); // drop the just-saved user message
        }

        List<Message> messages = new ArrayList<>();
        for (ChatMessage m : ordered) {
            if (m.getRole() == ChatMessage.ChatRole.USER) {
                messages.add(new UserMessage(m.getContent()));
            } else {
                messages.add(new AssistantMessage(m.getContent()));
            }
        }
        return messages;
    }

    private ChatMessage saveMessage(ChatMessage.ChatRole role, String content, boolean safetyIntercepted) {
        return chatMessageRepository.save(ChatMessage.builder()
                .role(role)
                .content(content)
                .safetyIntercepted(safetyIntercepted)
                .build());
    }
}
