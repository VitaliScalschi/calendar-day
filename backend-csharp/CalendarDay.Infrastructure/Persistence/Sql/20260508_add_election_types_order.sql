BEGIN;

ALTER TABLE election_types
    ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY id) AS rn
    FROM election_types
)
UPDATE election_types et
SET display_order = ordered.rn
FROM ordered
WHERE et.id = ordered.id;

COMMIT;
