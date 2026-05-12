# CalendarDay Wiki

Documentatie functionala si tehnica pentru sistemul de gestionare a scrutinelor si termenelor.

## 1. Scopul sistemului

CalendarDay ajuta utilizatorii sa:
- vizualizeze termenele pe scrutin in Calendar si Arhiva
- filtreze rapid dupa tip scrutin, responsabil, cautare text
- consulte detalii complete (descriere, responsabili, grupuri tinta, cadru normativ)
- exporte planul calendaristic in Excel

## 2. Arhitectura pe scurt

### Frontend
- `React + Vite + TypeScript`
- pagini principale:
  - `CalendarPage`
  - `HistoryPage` (`/arhiva`)
  - pagini admin (nomenclatoare, audit, utile)

### Backend
- `ASP.NET Core` cu structura separata:
  - `CalendarDay.Api` - endpointuri REST
  - `CalendarDay.Application` - DTO/validari/contracte
  - `CalendarDay.Domain` - entitati
  - `CalendarDay.Infrastructure` - EF Core + persistenta + seed

### Baza de date
- PostgreSQL (EF Core migrations)

## 3. Module functionale

### 3.1 Calendar
- vizualizari: luna, an, lista
- filtrare pe scrutin activ (selector afisat doar cand sunt > 1 scrutinuri active)
- popover pentru zile aglomerate (`+N`)
- modal de detalii
- dashboard de stare:
  - Expirate
  - Urmeaza 7 zile
  - Azi
  - Fara responsabil
- timeline simplu pe scrutinul selectat

### 3.2 Arhiva
- lista de scrutinuri inactive
- filtrare dupa:
  - text
  - tip scrutin (pe baza `electionTypeIds` din API)
- lista evenimente istorice + modal detalii

### 3.3 Export
- export Excel (`.xlsx`) din Calendar:
  - Data inceput
  - Data sfarsit
  - Scrutin
  - Termen
  - Descriere
  - Responsabili
  - Grupuri tinta

### 3.4 Audit
- middleware de audit activ in API
- endpoint de citire loguri in zona admin

## 4. Model date (nivel business)

- `Election` - scrutin
- `Deadline` - eveniment/termen principal
- `DeadlineDate` - date concrete (single/multiple/range)
- `DeadlineResponsible` - responsabili
- `DeadlineGroup` - grupuri tinta
- `Regulation` - acte/cadru normativ
- `AuditLog` - trasabilitate actiuni API

## 5. Fluxuri cheie pentru utilizator

### 5.1 Vizualizare termene in Calendar
1. Utilizatorul deschide `/calendar`.
2. Aplicatia incarca datele grouped by election.
3. Se selecteaza implicit primul scrutin disponibil.
4. Utilizatorul schimba vizualizarea sau filtrul si deschide detalii in modal.

### 5.2 Filtrare in Arhiva
1. Utilizatorul intra pe `/arhiva`.
2. Selecteaza unul sau mai multe tipuri in `Tip scrutin`.
3. Lista scrutinurilor se reduce conform tipurilor selectate.
4. Utilizatorul consulta evenimentele si detaliile.

### 5.3 Export plan calendaristic
1. Utilizatorul apasa `Exporta planul calendaristic`.
2. Sistemul genereaza fisierul Excel local.
3. Utilizatorul descarca fisierul cu data curenta in nume.

## 6. API (rezumat)

Endpointuri relevante:
- `GET /api/elections`
- `GET /api/elections/inactive`
- `GET /api/deadlines/grouped-by-election`
- `GET /api/election-types`
- `GET /api/audit-logs` (zona admin, in functie de controller/politici)

## 7. Roluri si securitate

- autentificare JWT
- politici:
  - `AdminOnly`
  - `EditorOrAdmin`
- audit middleware activ pe requesturi autentificate

## 8. UX si accesibilitate

Principii aplicate:
- contrast suficient pentru stari vizuale
- focus vizibil la navigare cu tastatura
- etichete clare la controale de filtrare
- onboarding contextual pentru prima utilizare

## 9. Operare si mentenanta

### Start local
- frontend: `npm install` + `npm run dev`
- backend: `dotnet run --project backend-csharp/CalendarDay.Api`
- db: PostgreSQL local / docker

### Migrari
- `dotnet ef migrations add <Nume> --project backend-csharp/CalendarDay.Infrastructure --startup-project backend-csharp/CalendarDay.Api`
- `dotnet ef database update --project backend-csharp/CalendarDay.Infrastructure --startup-project backend-csharp/CalendarDay.Api`

## 10. Roadmap recomandat

- notificari proactive (email/in-app, opt-in pe utilizator)
- istoric modificari la nivel de termen (before/after + actor)
- centru notificari in aplicatie
- comparare intre scrutinuri (split-view)

## 11. Conventii pentru actualizarea acestui wiki

- fiecare schimbare functionala majora trebuie documentata in max 24h
- adauga data ultimei actualizari in commit message sau in sectiunea de schimbari
- evita text generic; documenteaza deciziile si impactul pentru utilizator

