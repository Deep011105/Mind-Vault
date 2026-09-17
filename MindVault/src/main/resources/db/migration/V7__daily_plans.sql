-- One AI-generated plan per calendar day, with per-task tracking.
CREATE TABLE daily_plans (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_date          DATE NOT NULL,
    generated_by_ai    BOOLEAN NOT NULL DEFAULT TRUE,
    completion_percent SMALLINT,
    overall_mood       VARCHAR(20),
    ai_reflection      TEXT,   -- stored after evening reflection
    planning_notes     TEXT,   -- AI's reasoning block shown to user
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_daily_plans_date UNIQUE (plan_date)
);

CREATE TABLE daily_tasks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id           UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
    title             VARCHAR(300) NOT NULL,
    priority          VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    estimated_minutes INT,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    -- PENDING | STARTED | COMPLETED | PARTIAL | SKIPPED
    reason_skipped    TEXT,
    is_optional       BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order        INT NOT NULL DEFAULT 0,
    started_at        TIMESTAMP,
    completed_at      TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_plans_date    ON daily_plans (plan_date);
CREATE INDEX idx_daily_tasks_plan_id ON daily_tasks (plan_id);
