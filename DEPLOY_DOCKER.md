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
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

Aplicatia web va fi pe:
- `http://<IP-SERVER>`

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
