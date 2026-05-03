-- Tipuri de alegeri (PostgreSQL), id-uri fixe 1–7.

CREATE TABLE IF NOT EXISTS election_types (
  id   integer PRIMARY KEY,
  name character varying(200) NOT NULL UNIQUE
);

INSERT INTO election_types (id, name) VALUES
  (1, 'Alegeri parlamentare'),
  (2, 'Alegeri parlamentare noi'),
  (3, 'Alegeri prezidențiale'),
  (4, 'Referendum'),
  (5, 'Alegeri locale generale'),
  (6, 'Alegeri locale noi'),
  (7, 'Alegeri regionale')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
