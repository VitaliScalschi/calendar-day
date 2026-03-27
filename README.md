# Comisia Electorală Centrală a Republicii Moldova

Proiect React inspirat de designul site-ului oficial al Comisiei Electorale Centrale a Republicii Moldova (https://a.cec.md/).

## Caracteristici

- **Header** cu selector de limbă (RO/RU/EN) și navigare principală
- **Secțiune Statistici** cu numărul alegătorilor înscriși în Registrul de Stat al Alegătorilor
- **Secțiune Știri** cu cele mai recente comunicate și evenimente CEC
- **Linkuri Rapide** către servicii importante:
  - Ședințe CEC și hotărâri
  - Mass-Media și comunicate de presă
  - Verificare în Registrul de Stat al Alegătorilor
  - Funcții vacante
  - Transparență decizională
  - Finanțarea partidelor și campaniilor
  - Și multe altele
- **Footer** complet cu informații de contact, linkuri utile și numere de telefon importante

## Tehnologii

- React 18
- Vite
- CSS3 (Grid, Flexbox)

## Instalare

```bash
npm install
```

## Rulare

```bash
npm run dev
```

Aplicația va rula pe `http://localhost:5173`

## Build pentru producție

```bash
npm run build
```

## Structura proiectului

```
src/
├── components/
│   ├── Header.jsx          # Header cu navigare și selector de limbă
│   ├── StatsSection.jsx    # Secțiunea cu statistici importante
│   ├── NewsSection.jsx     # Secțiunea cu știri și evenimente
│   ├── QuickLinks.jsx      # Linkuri rapide către servicii
│   └── Footer.jsx          # Footer cu contacte și linkuri utile
├── App.jsx
├── App.css
├── main.jsx
└── index.css
```

## Design

Designul este inspirat de site-ul oficial CEC, cu:
- Culori profesionale și neutre
- Layout responsive pentru toate dispozitivele
- Carduri interactive cu efecte hover
- Tipografie clară și ușor de citit
- Structură organizată și accesibilă

