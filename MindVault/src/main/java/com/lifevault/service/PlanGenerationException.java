package com.lifevault.service;

/** Thrown when the local LLM can't be reached, or its response can't be parsed as a valid plan. */
public class PlanGenerationException extends RuntimeException {
    public PlanGenerationException(String message) {
        super(message);
    }
}
