-- One row per insight type — upserted on every analysis run so values stay current.
CREATE TABLE ai_insights (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         VARCHAR(60) NOT NULL,
    description  TEXT NOT NULL,
    confidence   SMALLINT,       -- 0–100
    generated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_ai_insights_type UNIQUE (type)
);
