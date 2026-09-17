package com.lifevault.repository;

import com.lifevault.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findAllByOrderByCreatedAtAsc();

    /** Most recent N turns, newest first — caller should reverse for prompt order. */
    List<ChatMessage> findByOrderByCreatedAtDesc(Pageable pageable);
}
