package com.lifevault.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "daily_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_date", nullable = false, unique = true)
    private LocalDate planDate;

    @Column(name = "generated_by_ai", nullable = false)
    @Builder.Default
    private boolean generatedByAi = true;

    @Column(name = "completion_percent")
    private Integer completionPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_mood", length = 20)
    private Mood overallMood;

    @Column(name = "ai_reflection", columnDefinition = "TEXT")
    private String aiReflection;

    @Column(name = "planning_notes", columnDefinition = "TEXT")
    private String planningNotes;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DailyTask> tasks = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addTask(DailyTask task) {
        tasks.add(task);
        task.setPlan(this);
    }

    public void removeTask(DailyTask task) {
        tasks.remove(task);
        task.setPlan(null);
    }
}
