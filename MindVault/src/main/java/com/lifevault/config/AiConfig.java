package com.lifevault.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    /**
     * ChatModel is auto-configured by spring-ai-starter-model-ollama from the
     * spring.ai.ollama.chat.* properties (model name intentionally left unchanged
     * per hardware constraints). We just wrap it as a ChatClient here since that's
     * the nicer fluent API the services use.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }
}
