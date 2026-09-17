package com.lifevault.dto;

import com.lifevault.entity.Mood;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DailyPlanResponse(
        UUID id,
        LocalDate planDate,
        boolean generatedByAi,
        Integer completionPercent,
        Mood overallMood,
        String aiReflection,
        String planningNotes,
        List<DailyTaskResponse> tasks
) {}
