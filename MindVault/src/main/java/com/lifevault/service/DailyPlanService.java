package com.lifevault.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifevault.dto.DailyPlanResponse;
import com.lifevault.dto.DailyTaskResponse;
import com.lifevault.dto.TaskStatusUpdateRequest;
import com.lifevault.entity.DailyPlan;
import com.lifevault.entity.DailyTask;
import com.lifevault.entity.TaskStatus;
import com.lifevault.repository.DailyPlanRepository;
import com.lifevault.repository.DailyTaskRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyPlanService {

    private final DailyPlanRepository planRepository;
    private final DailyTaskRepository taskRepository;
    private final PlanningContextBuilder contextBuilder;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    private static final String PLANNER_SYSTEM_PROMPT = """
            You are a personal productivity planner for the user. Your goal is to create tomorrow's task list as a JSON array.
            Review the user's long-term goals, their recent task completion performance, their recent journal entries (which include mood, stress, and energy), and any learned AI patterns.

            Rules:
            - Create a maximum of 5 tasks. (If the recent completion rate is below 60%, suggest fewer tasks).
            - Prioritize items related to HIGH priority goals or upcoming deadlines.
            - If burnout is detected or energy is low, suggest lighter or optional tasks.
            - Return ONLY a valid JSON array. Do NOT include markdown blocks, explanations, or any text other than the JSON itself.

            JSON Format:
            [
              {
                "title": "Task description",
                "priority": "HIGH" | "MEDIUM" | "LOW",
                "estimatedMinutes": 60,
                "isOptional": false
              }
            ]
            """;

    public DailyPlanResponse generateNextPlan() {
        // Step 1 (DB only, short transaction): figure out which date we're planning
        // for and clear out any existing plan for it. Deliberately NOT wrapping the
        // LLM call below in this same transaction — a blocking call to local Ollama
        // can take a long time (or hang), and holding a DB connection open for that
        // whole window can exhaust the HikariCP pool and stall unrelated requests.
        LocalDate targetDate = transactionTemplate.execute(status -> {
            // First-ever plan: target TODAY so it's immediately visible via getTodaysPlan()
            // (otherwise a brand-new user generates a plan for "tomorrow" and sees nothing
            // until the calendar actually rolls over). Once a plan for today exists, this
            // naturally falls back to the intended nightly-planning cycle: generate tomorrow's.
            LocalDate date = planRepository.findByPlanDate(LocalDate.now()).isEmpty()
                    ? LocalDate.now()
                    : LocalDate.now().plusDays(1);

            // If a plan already exists for the target date, we overwrite it by regenerating.
            planRepository.findByPlanDate(date).ifPresent(planRepository::delete);
            planRepository.flush();
            return date;
        });

        // Step 2 (no transaction, no held DB connection): build context (each repo
        // call inside buildContext() gets its own short-lived transaction) and call
        // the local LLM. This is the slow/blocking part.
        String context = contextBuilder.buildContext();
        String prompt = "Generate the plan for " + targetDate + " based on this context:\n\n" + context;

        log.info("Requesting plan generation for {}", targetDate);
        String response;
        try {
            response = chatClient.prompt()
                    .system(PLANNER_SYSTEM_PROMPT)
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Local LLM call failed during plan generation", e);
            throw new PlanGenerationException(
                    "Couldn't reach the local AI model to generate a plan. Make sure Ollama is running and try again.");
        }

        response = extractJsonArray(response);

        List<DailyTask> generatedTasks = new ArrayList<>();
        try {
            List<TaskJsonDto> dtoList = objectMapper.readValue(response, new TypeReference<>() {});
            int order = 0;
            for (TaskJsonDto t : dtoList) {
                generatedTasks.add(DailyTask.builder()
                        .title(t.title())
                        .priority(t.priority())
                        .estimatedMinutes(t.estimatedMinutes())
                        .isOptional(t.isOptional())
                        .status(TaskStatus.PENDING)
                        .sortOrder(order++)
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to parse AI plan JSON: {}", response, e);
            throw new PlanGenerationException("The AI's plan wasn't in a valid format. Please try generating again.");
        }

        // Step 3 (DB only, short transaction): persist the generated plan.
        LocalDate finalTargetDate = targetDate;
        DailyPlan plan = transactionTemplate.execute(status -> {
            DailyPlan p = DailyPlan.builder()
                    .planDate(finalTargetDate)
                    .generatedByAi(true)
                    .planningNotes("Generated by AI based on recent context.")
                    .build();

            for (DailyTask t : generatedTasks) {
                p.addTask(t);
            }

            return planRepository.save(p);
        });

        return mapToResponse(plan);
    }

    /**
     * Strips markdown code fences if present, then falls back to extracting the
     * substring between the first '[' and the last ']' — local models don't always
     * follow "return ONLY JSON" instructions exactly, so this tolerates a stray
     * sentence before/after the array that pure fence-stripping would choke on.
     */
    private String extractJsonArray(String response) {
        if (response == null) {
            throw new PlanGenerationException("The AI returned an empty response. Please try again.");
        }
        String trimmed = response.trim();

        if (trimmed.contains("```")) {
            int start = trimmed.indexOf("```");
            int contentStart = trimmed.startsWith("```json", start) ? start + 7 : start + 3;
            int end = trimmed.indexOf("```", contentStart);
            if (end != -1) {
                trimmed = trimmed.substring(contentStart, end).trim();
            }
        }

        int arrStart = trimmed.indexOf('[');
        int arrEnd = trimmed.lastIndexOf(']');
        if (arrStart != -1 && arrEnd != -1 && arrEnd > arrStart) {
            trimmed = trimmed.substring(arrStart, arrEnd + 1);
        }

        return trimmed;
    }

    @Transactional(readOnly = true)
    public DailyPlanResponse getTodaysPlan() {
        return planRepository.findByPlanDate(LocalDate.now())
                .map(this::mapToResponse)
                .orElse(null); // Return 204 or empty if no plan today
    }

    @Transactional(readOnly = true)
    public DailyPlanResponse getPlanByDate(LocalDate date) {
        return planRepository.findByPlanDate(date)
                .map(this::mapToResponse)
                .orElseThrow(() -> new EntityNotFoundException("No plan for date: " + date));
    }

    @Transactional(readOnly = true)
    public List<DailyPlanResponse> getPlanHistory() {
        return planRepository.findTop14ByOrderByPlanDateDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTaskStatus(UUID taskId, TaskStatusUpdateRequest req) {
        DailyTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        if (req.status() == TaskStatus.STARTED && task.getStartedAt() == null) {
            task.setStartedAt(LocalDateTime.now());
        } else if (req.status() == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
            if (task.getStartedAt() == null) {
                task.setStartedAt(LocalDateTime.now());
            }
        }

        task.setStatus(req.status());
        task.setReasonSkipped(req.reasonSkipped());

        taskRepository.save(task);

        // Recompute parent plan completion %
        recomputeCompletionPercent(task.getPlan());
    }

    private void recomputeCompletionPercent(DailyPlan plan) {
        long total = plan.getTasks().size();
        if (total == 0) return;

        long completed = plan.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();
        long partial = plan.getTasks().stream()
                .filter(t -> t.getStatus() == TaskStatus.PARTIAL)
                .count();

        // simple weighting: completed = 100%, partial = 50%
        int percent = (int) (((completed * 100.0) + (partial * 50.0)) / total);
        plan.setCompletionPercent(percent);
        planRepository.save(plan);
    }

    private DailyPlanResponse mapToResponse(DailyPlan plan) {
        List<DailyTaskResponse> tasks = plan.getTasks().stream()
                .map(t -> new DailyTaskResponse(
                        t.getId(), t.getTitle(), t.getPriority(), t.getEstimatedMinutes(),
                        t.getStatus(), t.getReasonSkipped(), t.isOptional(), t.getSortOrder(),
                        t.getStartedAt(), t.getCompletedAt()
                )).toList();

        return new DailyPlanResponse(
                plan.getId(),
                plan.getPlanDate(),
                plan.isGeneratedByAi(),
                plan.getCompletionPercent(),
                plan.getOverallMood(),
                plan.getAiReflection(),
                plan.getPlanningNotes(),
                tasks
        );
    }

    // Helper DTO for Jackson
    private record TaskJsonDto(
            String title,
            com.lifevault.entity.GoalPriority priority,
            Integer estimatedMinutes,
            boolean isOptional
    ) {}
}