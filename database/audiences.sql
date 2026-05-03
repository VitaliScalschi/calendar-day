-- Audiences lookup table (PostgreSQL)

CREATE TABLE IF NOT EXISTS audiences (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "key"      text NOT NULL UNIQUE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- U&'...' cu \hhhh = cod Unicode (PostgreSQL): diacritice corecte indiferent de encoding-ul fișierului .sql.
INSERT INTO audiences ("key", name)
VALUES
  ('political', 'Partidele Politice'),
  ('political_organ', 'Organele Electorale'),
  ('public', 'Publicul larg'),
  ('independent_candidates', U&'Candida\021Bii independen\021Bi'),
  ('observers', 'Observatori'),
  ('public_authorities', U&'Autorit\0103\021Bi publice')
ON CONFLICT ("key") DO UPDATE SET
  name = EXCLUDED.name;
