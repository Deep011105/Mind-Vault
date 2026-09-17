package com.lifevault.repository;

import com.lifevault.entity.DailyPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyPlanRepository extends JpaRepository<DailyPlan, UUID> {
    Optional<DailyPlan> findByPlanDate(LocalDate planDate);
    List<DailyPlan> findTop14ByOrderByPlanDateDesc();
}
