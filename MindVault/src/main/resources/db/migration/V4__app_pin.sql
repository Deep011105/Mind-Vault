-- Stores the bcrypt hash of the user's PIN.
-- By convention there is only ever ONE row in this table (single-user local app).
-- Changing the PIN = delete the existing row + insert a new one.
CREATE TABLE app_pin (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_hash   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
