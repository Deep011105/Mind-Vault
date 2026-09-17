package com.lifevault.service;

import com.lifevault.entity.AiInsight;
import com.lifevault.entity.DailyPlan;
import com.lifevault.entity.TaskStatus;
import com.lifevault.repository.AiInsightRepository;
import com.lifevault.repository.DailyPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsightService {

    private final AiInsightRepository insightRepository;
    private final DailyPlanRepository planRepository;

    @Transactional
    public void updateInsights() {
        List<DailyPlan> history = planRepository.findTop14ByOrderByPlanDateDesc();
        if (history.size() < 3) return; // Need at least 3 days to form patterns

        calculateAvgCompletion(history);
        checkBurnoutIndicator(history);
        // Additional patterns (best time, skip patterns) would be added here
    }

    private void calculateAvgCompletion(List<DailyPlan> history) {
        double avg = history.stream()
                .filter(p -> p.getCompletionPercent() != null)
                .mapToInt(DailyPlan::getCompletionPercent)
                .average()
                .orElse(0.0);

        upsertInsight("AVG_COMPLETION", 
                String.format("Average completion rate over last %d days is %.1f%%", history.size(), avg), 
                80);
    }

    private void checkBurnoutIndicator(List<DailyPlan> history) {
        int consecutiveLow = 0;
        for (int i = 0; i < Math.min(5, history.size()); i++) {
            DailyPlan plan = history.get(i);
            if (plan.getCompletionPercent() != null && plan.getCompletionPercent() < 40) {
                consecutiveLow++;
            } else {
                break; // must be consecutive from most recent
            }
        }

        if (consecutiveLow >= 3) {
            upsertInsight("BURNOUT_INDICATOR", 
                    "Burnout risk: completion rate below 40% for " + consecutiveLow + " consecutive days. Recommend lightening the load.", 
                    90);
        } else {
            // Clear it if recovering
            insightRepository.findByType("BURNOUT_INDICATOR").ifPresent(insightRepository::delete);
        }
    }

    private void upsertInsight(String type, String description, int confidence) {
        AiInsight insight = insightRepository.findByType(type)
                .orElse(AiInsight.builder().type(type).build());
        insight.setDescription(description);
        insight.setConfidence(confidence);
        insightRepository.save(insight);
    }
}
