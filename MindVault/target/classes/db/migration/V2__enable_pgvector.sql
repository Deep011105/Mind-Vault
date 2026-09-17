-- Required before Spring AI's pgvector store can create its table.
-- If your Postgres role lacks permission to create extensions, run this once
-- manually as a superuser instead: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;
