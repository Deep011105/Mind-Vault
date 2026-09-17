package com.lifevault.service;

import com.lifevault.dto.GoalRequest;
import com.lifevault.dto.GoalResponse;
import com.lifevault.entity.UserGoal;
import com.lifevault.repository.UserGoalRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final UserGoalRepository goalRepository;

    @Transactional(readOnly = true)
    public List<GoalResponse> listActiveGoals() {
        return goalRepository.findByActiveTrueOrderByPriorityAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public GoalResponse createGoal(GoalRequest req) {
        UserGoal goal = UserGoal.builder()
                .title(req.title())
                .description(req.description())
                .priority(req.priority())
                .deadline(req.deadline())
                .dailyTargetMinutes(req.dailyTargetMinutes())
                .active(true)
                .build();
        goalRepository.save(goal);
        return mapToResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(UUID id, GoalRequest req) {
        UserGoal goal = getGoalOrThrow(id);
        goal.setTitle(req.title());
        goal.setDescription(req.description());
        goal.setPriority(req.priority());
        goal.setDeadline(req.deadline());
        goal.setDailyTargetMinutes(req.dailyTargetMinutes());
        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deactivateGoal(UUID id) {
        UserGoal goal = getGoalOrThrow(id);
        goal.setActive(false);
        goalRepository.save(goal);
    }

    private UserGoal getGoalOrThrow(UUID id) {
        return goalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));
    }

    private GoalResponse mapToResponse(UserGoal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getPriority(),
                goal.getDeadline(),
                goal.getDailyTargetMinutes(),
                goal.isActive(),
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }
}
