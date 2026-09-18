package com.lifevault.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.HttpClientSettings;
import org.springframework.boot.restclient.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

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

    /**
     * Applies a connect + read timeout to the RestClient.Builder that spring-ai's
     * Ollama autoconfiguration uses internally. Without this, a stuck/overloaded
     * local Ollama instance hangs the calling thread indefinitely with no
     * exception ever thrown — which previously looked like "plan generation just
     * silently stops working." Now it fails fast with a normal IOException that
     * DailyPlanService (and any other caller) can catch and report.
     *
     * Generous read timeout since local 3B-class models on modest hardware can
     * genuinely take a while — this is a safety net for "actually stuck," not a
     * tight SLA.
     */
    @Bean
    public RestClientCustomizer ollamaTimeoutCustomizer() {
        HttpClientSettings settings = HttpClientSettings.defaults()
                .withConnectTimeout(Duration.ofSeconds(10))
                .withReadTimeout(Duration.ofSeconds(120));
        var requestFactory = ClientHttpRequestFactoryBuilder.detect().build(settings);
        return restClientBuilder -> restClientBuilder.requestFactory(requestFactory);
    }
}