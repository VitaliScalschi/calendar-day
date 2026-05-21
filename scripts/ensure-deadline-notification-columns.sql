-- Coloane pentru notificări email la evenimente (deadline)
ALTER TABLE "Deadlines"
  ADD COLUMN IF NOT EXISTS "NotificationEmail" text NULL;

ALTER TABLE "Deadlines"
  ALTER COLUMN "NotificationEmail" TYPE text;

ALTER TABLE "Deadlines"
  ADD COLUMN IF NOT EXISTS "NotificationSentOn" date NULL;

ALTER TABLE deadline_dates
  ADD COLUMN IF NOT EXISTS "NotificationSentOn" date NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260519120000_AddDeadlineNotificationEmail', '10.0.0-rc.1.25451.107'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory"
    WHERE "MigrationId" = '20260519120000_AddDeadlineNotificationEmail'
);
