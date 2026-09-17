-- Adds optional stress and energy scores to journal entries.
-- Nullable so existing entries are unaffected.
ALTER TABLE journal_entries
    ADD COLUMN stress SMALLINT CHECK (stress BETWEEN 1 AND 5),
    ADD COLUMN energy SMALLINT CHECK (energy BETWEEN 1 AND 5);
