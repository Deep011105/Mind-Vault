package com.lifevault.controller;

import com.lifevault.dto.ChatMessageResponse;
import com.lifevault.dto.ChatRequest;
import com.lifevault.entity.ChatMessage;
import com.lifevault.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        ChatMessage reply = chatService.handleUserMessage(request.message());
        return ResponseEntity.ok(ChatMessageResponse.from(reply));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageResponse>> history() {
        List<ChatMessageResponse> history = chatService.history().stream()
                .map(ChatMessageResponse::from)
                .toList();
        return ResponseEntity.ok(history);
    }
}
