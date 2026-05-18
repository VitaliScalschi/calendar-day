-- Rulează dacă forgot-password dă eroare de coloane (ex. 42703: column p.id does not exist).
-- Apoi repornește API-ul sau: dotnet ef database update

DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "TokenHash" character varying(128) NOT NULL,
    "ExpiresAtUtc" timestamp with time zone NOT NULL,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "UsedAtUtc" timestamp with time zone NULL,
    CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_password_reset_tokens_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_password_reset_tokens_TokenHash" ON password_reset_tokens ("TokenHash");
CREATE INDEX "IX_password_reset_tokens_UserId_UsedAtUtc" ON password_reset_tokens ("UserId", "UsedAtUtc");
