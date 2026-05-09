BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY,
    username varchar(320) NULL,
    action varchar(120) NOT NULL,
    details varchar(4000) NULL,
    endpoint varchar(1000) NOT NULL,
    method varchar(16) NOT NULL,
    status_code integer NOT NULL,
    ip_address varchar(64) NULL,
    created_at_utc timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at_utc ON audit_logs (created_at_utc);
CREATE INDEX IF NOT EXISTS ix_audit_logs_username ON audit_logs (username);
CREATE INDEX IF NOT EXISTS ix_audit_logs_status_code ON audit_logs (status_code);

COMMIT;
