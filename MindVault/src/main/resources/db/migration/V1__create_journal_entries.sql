CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    mood VARCHAR(20) NOT NULL,
    word_count INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    week_number INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_journal_year_week ON journal_entries (year, week_number);
CREATE INDEX idx_journal_year_month ON journal_entries (year, month);
CREATE INDEX idx_journal_deleted_at ON journal_entries (deleted_at);