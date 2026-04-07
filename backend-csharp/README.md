# CalendarDay C# Backend

Clean architecture backend for elections and deadlines.

## Projects

- `CalendarDay.Api` - controllers + swagger
- `CalendarDay.Application` - DTOs, contracts, validators
- `CalendarDay.Domain` - entities
- `CalendarDay.Infrastructure` - EF Core, PostgreSQL, services, seed

## Run

1. Start PostgreSQL (Docker):
   - `docker compose up -d postgres`
2. Connection string (already set in `CalendarDay.Api/appsettings.json`):
   - `Host=localhost;Port=5432;Database=calendar_day;Username=postgres;Password=postgres`
3. Install EF CLI if needed:
   - `dotnet tool install --global dotnet-ef`
4. Create migration:
   - `dotnet ef migrations add InitialCreate --project backend-csharp/CalendarDay.Infrastructure --startup-project backend-csharp/CalendarDay.Api`
5. Apply migration:
   - `dotnet ef database update --project backend-csharp/CalendarDay.Infrastructure --startup-project backend-csharp/CalendarDay.Api`
6. Run API:
   - `dotnet run --project backend-csharp/CalendarDay.Api`

OpenAPI JSON (Development): `/openapi/v1.json`

## Seed from JSON

Call:

- `POST /api/seed/from-json`

Optional query param:

- `path=C:\\path\\to\\data.json`
