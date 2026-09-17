package com.lifevault.repository;

import com.lifevault.entity.DailyTask;
import com.lifevault.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DailyTaskRepository extends JpaRepository<DailyTask, UUID> {
    List<DailyTask> findByPlanIdOrderBySortOrderAsc(UUID planId);
    long countByPlanIdAndStatus(UUID planId, TaskStatus status);
}
