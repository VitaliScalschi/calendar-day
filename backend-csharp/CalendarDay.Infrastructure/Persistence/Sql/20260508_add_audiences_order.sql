BEGIN;

ALTER TABLE audiences
    ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY id) AS rn
    FROM audiences
)
UPDATE audiences a
SET display_order = ordered.rn
FROM ordered
WHERE a.id = ordered.id;

COMMIT;
