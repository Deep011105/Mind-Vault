package com.lifevault.service;

import com.lifevault.dto.MoodStatsResponse;
import com.lifevault.entity.JournalEntry;
import com.lifevault.entity.Mood;
import com.lifevault.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MoodStatsService {

    private final JournalEntryRepository repository;

    public MoodStatsResponse getStats() {
        Map<Mood, Long> counts = new EnumMap<>(Mood.class);
        for (var row : repository.countGroupedByMood()) {
            counts.put(row.getMood(), row.getCnt());
        }

        Mood mostFrequent = counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        List<Instant> allDates = repository.findAllCreatedAtOrderByCreatedAtDesc();
        int[] streaks = computeStreaks(allDates);

        List<JournalEntry> recent = repository.findByDeletedAtIsNullOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, 30));
        List<MoodStatsResponse.DailyMoodPoint> last30 = recent.stream()
                .map(e -> new MoodStatsResponse.DailyMoodPoint(
                        e.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                        e.getMood()))
                .sorted(Comparator.comparing(MoodStatsResponse.DailyMoodPoint::date))
                .toList();

        return new MoodStatsResponse(counts, mostFrequent, streaks[0], streaks[1], last30);
    }

    /** Returns {currentStreak, longestStreak}, both in distinct calendar days with an entry. */
    private int[] computeStreaks(List<Instant> createdAtDesc) {
        if (createdAtDesc.isEmpty()) return new int[]{0, 0};

        ZoneId zone = ZoneId.systemDefault();
        TreeSet<LocalDate> days = new TreeSet<>(Comparator.reverseOrder());
        for (Instant i : createdAtDesc) {
            days.add(i.atZone(zone).toLocalDate());
        }

        List<LocalDate> ordered = new ArrayList<>(days); // newest first
        int longest = 1, currentRun = 1, best = 1;

        for (int i = 1; i < ordered.size(); i++) {
            if (ordered.get(i - 1).minusDays(1).equals(ordered.get(i))) {
                currentRun++;
            } else {
                best = Math.max(best, currentRun);
                currentRun = 1;
            }
        }
        longest = Math.max(best, currentRun);

        LocalDate today = LocalDate.now(zone);
        int current = 0;
        LocalDate cursor = today;
        if (!ordered.contains(today)) {
            // Allow "yesterday" to still count as an active streak, just not extended today yet.
            cursor = today.minusDays(1);
            if (!ordered.contains(cursor)) {
                return new int[]{0, longest};
            }
        }
        while (ordered.contains(cursor)) {
            current++;
            cursor = cursor.minusDays(1);
        }

        return new int[]{current, longest};
    }
}
