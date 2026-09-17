package com.lifevault.dto;

import com.lifevault.entity.Mood;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record MoodStatsResponse(
        Map<Mood, Long> moodCounts,
        Mood mostFrequentMood,
        int currentStreakDays,
        int longestStreakDays,
        List<DailyMoodPoint> last30Days
) {
    public record DailyMoodPoint(LocalDate date, Mood mood) {}
}
