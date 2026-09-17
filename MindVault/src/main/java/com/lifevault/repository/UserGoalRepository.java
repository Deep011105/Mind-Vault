package com.lifevault.repository;

import com.lifevault.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface UserGoalRepository extends JpaRepository<UserGoal, UUID> {

    /**
     * NOT a plain "ORDER BY priority ASC" — priority is stored as a STRING enum,
     * so alphabetical order would give HIGH, LOW, MEDIUM instead of actual
     * importance order. This CASE expression forces HIGH -> MEDIUM -> LOW.
     */
    @Query("select g from UserGoal g where g.active = true " +
           "order by case g.priority when com.lifevault.entity.GoalPriority.HIGH then 0 " +
           "when com.lifevault.entity.GoalPriority.MEDIUM then 1 else 2 end")
    List<UserGoal> findByActiveTrueOrderByPriorityAsc();
}
