#!/usr/bin/env bash
# Resetează parola unui utilizator în PostgreSQL (hash BCrypt compatibil cu API-ul).
#
# Utilizare:
#   ./scripts/reset-user-password.sh admin@cec.md 'ParolaNoua123'
#   ./scripts/reset-user-password.sh                    # întreabă email + parolă
#
# Rulează din rădăcina proiectului (acolo e docker-compose.prod.yml).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

EMAIL="${1:-}"
PASSWORD="${2:-}"

if [[ -z "$EMAIL" ]]; then
  read -rp "Email utilizator [admin@cec.md]: " EMAIL
  EMAIL="${EMAIL:-admin@cec.md}"
fi

if [[ -z "$PASSWORD" ]]; then
  read -rsp "Parolă nouă: " PASSWORD
  echo
  read -rsp "Confirmă parola: " PASSWORD2
  echo
  if [[ "$PASSWORD" != "$PASSWORD2" ]]; then
    echo "Eroare: parolele nu coincid." >&2
    exit 1
  fi
fi

if [[ ${#PASSWORD} -lt 6 ]]; then
  echo "Eroare: parola trebuie să aibă minim 6 caractere (ca în API)." >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Eroare: nu găsesc $COMPOSE_FILE în $ROOT_DIR" >&2
  exit 1
fi

COMPOSE=(docker compose -f "$COMPOSE_FILE")
if [[ -f "$ENV_FILE" ]]; then
  COMPOSE+=(--env-file "$ENV_FILE")
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-calendar_day}"

echo "Reset parolă pentru: $EMAIL (baza: $PG_DB, user PG: $PG_USER)"

ROWS="$("${COMPOSE[@]}" exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -t -A -v ON_ERROR_STOP=1 \
  -v "app_email=$EMAIL" -v "app_password=$PASSWORD" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
WITH updated AS (
  UPDATE "Users"
  SET
    "PasswordHash" = crypt(:'app_password', gen_salt('bf', 11)),
    "UpdatedAtUtc" = now()
  WHERE lower("Email") = lower(:'app_email')
  RETURNING "Email"
)
SELECT count(*)::text FROM updated;
SQL
)"

ROWS="$(echo "$ROWS" | tr -d '[:space:]')"

if [[ "$ROWS" != "1" ]]; then
  echo "Eroare: utilizatorul '$EMAIL' nu a fost găsit (rânduri actualizate: ${ROWS:-0})." >&2
  echo "Verifică în DB: SELECT \"Email\" FROM \"Users\";" >&2
  exit 1
fi

echo "Parola a fost actualizată pentru: $EMAIL"
echo "Testează login: https://calendar.cec.md/login"
