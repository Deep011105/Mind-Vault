package com.lifevault.service;

import com.lifevault.entity.AiInsight;
import com.lifevault.entity.DailyPlan;
import com.lifevault.entity.DailyTask;
import com.lifevault.entity.JournalEntry;
import com.lifevault.repository.AiInsightRepository;
import com.lifevault.repository.DailyPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Builds the context prompt for the AI planner, injecting user goals,
 * recent performance history, journal mood context, and learned AI insights.
 */
@Component
@RequiredArgsConstructor
public class PlanningContextBuilder {

    private final GoalService goalService;
    private final DailyPlanRepository planRepository;
    private final JournalService journalService;
    private final AiInsightRepository insightRepository;

    @Transactional(readOnly = true)
    public String buildContext() {
        StringBuilder sb = new StringBuilder();

        // 1. User Goals
        sb.append("USER GOALS:\n");
        var goals = goalService.listActiveGoals();
        if (goals.isEmpty()) {
            sb.append("(No active goals set by the user)\n");
        } else {
            for (var g : goals) {
                sb.append(String.format("- [%s] %s (Target: %s min/day)\n",
                        g.priority(), g.title(), g.dailyTargetMinutes() != null ? g.dailyTargetMinutes() : "none"));
            }
        }
        sb.append("\n");

        // 2. Recent Performance (Last 14 days)
        sb.append("PERFORMANCE (last 14 days):\n");
        var recentPlans = planRepository.findTop14ByOrderByPlanDateDesc();
        if (recentPlans.isEmpty()) {
            sb.append("(No recent planning history)\n");
        } else {
            sb.append("Date | Total Tasks | Completed % | Overall Mood\n");
            for (DailyPlan plan : recentPlans) {
                long total = plan.getTasks().size();
                long completed = plan.getTasks().stream()
                        .filter(t -> t.getStatus().name().equals("COMPLETED"))
                        .count();
                sb.append(String.format("%s | %d tasks (%d done) | %s%% | %s\n",
                        plan.getPlanDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        total,
                        completed,
                        plan.getCompletionPercent() != null ? plan.getCompletionPercent() : "N/A",
                        plan.getOverallMood() != null ? plan.getOverallMood() : "UNKNOWN"));
            }
        }
        sb.append("\n");

        // 3. Recent Journal Context (Last 7 days, max 5 entries)
        sb.append("RECENT JOURNAL CONTEXT (Mood, Stress, Energy):\n");
        var recentJournals = journalService.recentRaw(5);
        if (recentJournals.isEmpty()) {
            sb.append("(No recent journal entries)\n");
        } else {
            for (JournalEntry entry : recentJournals) {
                sb.append(String.format("- Date: %s, Mood: %s, Stress: %s/5, Energy: %s/5\n",
                        entry.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                        entry.getMood(),
                        entry.getStress() != null ? entry.getStress() : "?",
                        entry.getEnergy() != null ? entry.getEnergy() : "?"));
            }
        }
        sb.append("\n");

        // 4. Learned AI Insights
        sb.append("LEARNED PATTERNS (AI Insights):\n");
        var insights = insightRepository.findAllByOrderByGeneratedAtDesc();
        if (insights.isEmpty()) {
            sb.append("(No AI insights generated yet)\n");
        } else {
            for (AiInsight insight : insights) {
                sb.append(String.format("- %s: %s (Confidence: %s%%)\n",
                        insight.getType(), insight.getDescription(),
                        insight.getConfidence() != null ? insight.getConfidence() : "N/A"));
            }
        }

        return sb.toString();
    }
}
