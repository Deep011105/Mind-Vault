-- Hibernate's ddl-auto=validate expects java.lang.Integer fields to map to a
-- SQL INTEGER column. V5/V7/V8 declared these as SMALLINT, which fails schema
-- validation at startup ("wrong column type ... found [int2], expecting [int4]").
-- The values themselves are tiny (1-5, 0-100) so widening costs nothing.
ALTER TABLE journal_entries ALTER COLUMN stress TYPE INTEGER;
ALTER TABLE journal_entries ALTER COLUMN energy TYPE INTEGER;
ALTER TABLE daily_plans ALTER COLUMN completion_percent TYPE INTEGER;
ALTER TABLE ai_insights ALTER COLUMN confidence TYPE INTEGER;
