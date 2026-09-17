package com.lifevault.repository;

import com.lifevault.entity.JournalEntry;
import com.lifevault.entity.Mood;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    List<JournalEntry> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<JournalEntry> findByDeletedAtIsNullAndCreatedAtBetween(Instant from, Instant to);

    List<JournalEntry> findByDeletedAtIsNullAndYearAndWeekNumber(Integer year, Integer weekNumber);

    List<JournalEntry> findByDeletedAtIsNullAndYearAndMonth(Integer year, Integer month);

    /** Recency buffer for the memory context builder — most recent N entries, raw. */
    List<JournalEntry> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByDeletedAtIsNull();

    List<JournalEntry> findByDeletedAtIsNullAndMoodOrderByCreatedAtDesc(Mood mood);

    @Query("select e.mood as mood, count(e) as cnt from JournalEntry e " +
           "where e.deletedAt is null group by e.mood")
    List<MoodCount> countGroupedByMood();

    /** Used for streak calculation — just the dates of non-deleted entries, newest first. */
    @Query("select e.createdAt from JournalEntry e where e.deletedAt is null order by e.createdAt desc")
    List<Instant> findAllCreatedAtOrderByCreatedAtDesc();

    List<JournalEntry> findByDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtAsc(@Param("from") Instant from);

    interface MoodCount {
        Mood getMood();
        long getCnt();
    }
}
