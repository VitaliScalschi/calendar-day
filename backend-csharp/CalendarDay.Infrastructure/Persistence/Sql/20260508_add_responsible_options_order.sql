BEGIN;

ALTER TABLE responsible_options
    ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY label, id) AS rn
    FROM responsible_options
)
UPDATE responsible_options r
SET display_order = ordered.rn
FROM ordered
WHERE r.id = ordered.id;

COMMIT;
