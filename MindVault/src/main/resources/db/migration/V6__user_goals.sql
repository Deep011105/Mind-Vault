-- Long-term goals the user wants the AI to optimise their daily plans around.
CREATE TABLE user_goals (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                VARCHAR(200) NOT NULL,
    description          TEXT,
    priority             VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',  -- HIGH / MEDIUM / LOW
    deadline             DATE,
    daily_target_minutes INT,
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP NOT NULL DEFAULT now()
);
