# Deploy pe server cu Docker

## 1) Cerinte server
- Ubuntu 22.04+ (sau similar)
- Docker + Docker Compose plugin
- Portul `80` deschis (si `443` daca pui HTTPS reverse proxy)

## 2) Copiaza proiectul pe server
```bash
git clone <repo-url>
cd calendar_day
```

## 3) Configureaza variabilele de productie
```bash
cp .env.prod.example .env
```

Editeaza `.env` si seteaza cel putin:
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY` (lung, random, minim 32 caractere)

## 4) Porneste aplicatia
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 5) Verificare
```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs -f api
```

> **Numele containerului** nu este fix `calendar_day-api`. Compose îl generează automat
> (ex. `calendar_day-api-1`). Pentru loguri folosește mereu **serviciul** `api`, nu numele manual.

Test login direct în containerul API (înlocuiește numele din `docker ps`):
```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env exec api \
  wget -qO- --header="Content-Type: application/json" \
  --post-data='{"email":"admin@cec.md","password":"admin123"}' \
  http://localhost:8080/api/auth/login
```

Aplicatia web va fi pe:
- `http://<IP-SERVER>`

## 5b) Login returnează 500

Cauze frecvente:

1. **`JWT_SECRET_KEY` lipsă sau prea scurtă** în `.env` pe server. Docker suprascrie
   `appsettings.json` cu valoarea din mediu; dacă e goală, generarea token-ului JWT la login eșuează.
   - Verifică: `docker compose -f docker-compose.prod.yml --env-file .env exec api printenv Jwt__SecretKey`
   - Trebuie să aibă **minim 32 caractere**.

2. **Baza de date indisponibilă** (migrări eșuate). Vezi logurile:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env logs api --tail 80
   ```

3. **Containerele nu rulează**:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d
   ```

Cont implicit (creat la primul start dacă lipsește în DB): `admin@cec.md` / `admin123`.

### Reset parolă din linia de comandă

```bash
chmod +x scripts/reset-user-password.sh
./scripts/reset-user-password.sh admin@cec.md 'ParolaNoua123'
```

Scriptul actualizează `PasswordHash` în PostgreSQL (BCrypt, compatibil cu API-ul).

### Eroare `column u.DeletedAtUtc does not exist`

Schema DB e în urmă față de cod. **Remediere rapidă** (fără rebuild API), rulează scriptul SQL din proiect:

```bash
cd ~/calendar_day
docker compose -f docker-compose.prod.yml --env-file .env exec -T postgres \
  psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-calendar_day}" \
  < backend-csharp/CalendarDay.Infrastructure/Persistence/Sql/20260508_role_management.sql
```

Apoi repornește API-ul:

```bash
docker compose -f docker-compose.prod.yml --env-file .env restart api
```

**Remediere permanentă:** copiază codul nou (include migrarea `20260515120000_AddUserRoleManagementAndSoftDelete`) și:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build api
```

## 6) Oprire / update
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Note
- Frontend este servit de Nginx in containerul `web`.
- API ruleaza in containerul `api`.
- PostgreSQL ruleaza in containerul `postgres`.
- Endpointurile `/api/*` sunt proxy-uite de Nginx catre API.
