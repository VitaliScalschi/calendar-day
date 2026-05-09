-- Role management migration script (PostgreSQL)
-- Run this script before starting API with the new code.

BEGIN;

CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    description varchar(200),
    created_at_utc timestamp with time zone NOT NULL DEFAULT now(),
    updated_at_utc timestamp with time zone NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at_utc timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by_user_id uuid NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_users_user_id FOREIGN KEY (user_id) REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_roles_role_id ON user_roles (role_id);

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "DeletedAtUtc" timestamp with time zone NULL;
CREATE INDEX IF NOT EXISTS "IX_Users_IsDeleted_IsActive" ON "Users" ("IsDeleted", "IsActive");

INSERT INTO roles (id, name, description, created_at_utc)
VALUES
    ('5fa0e6db-f675-4ea7-a999-9b050b20ce70', 'Admin', 'Acces complet la administrare', now()),
    ('8c9cc1b8-8f0e-48ca-9638-4b2fe6f9c279', 'Editor', 'Poate modifica conținut', now()),
    ('f478e7b6-78a1-46be-9451-dc1e9c53f232', 'Viewer', 'Doar vizualizare', now())
ON CONFLICT (name) DO NOTHING;

-- Backfill role assignments from legacy enum column Users.Role
INSERT INTO user_roles (user_id, role_id, assigned_at_utc)
SELECT
    u."Id" AS user_id,
    CASE
        WHEN u."Role" = 1 THEN '5fa0e6db-f675-4ea7-a999-9b050b20ce70'::uuid
        WHEN u."Role" = 2 THEN '8c9cc1b8-8f0e-48ca-9638-4b2fe6f9c279'::uuid
        ELSE 'f478e7b6-78a1-46be-9451-dc1e9c53f232'::uuid
    END AS role_id,
    now() AS assigned_at_utc
FROM "Users" u
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Drop old legacy role column after successful backfill
ALTER TABLE "Users" DROP COLUMN IF EXISTS "Role";

COMMIT;
