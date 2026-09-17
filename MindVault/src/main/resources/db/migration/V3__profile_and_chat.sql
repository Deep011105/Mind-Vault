CREATE TABLE user_profile_summary (
    id UUID PRIMARY KEY,
    summary_text TEXT NOT NULL,
    entries_incorporated INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    safety_intercepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at);
