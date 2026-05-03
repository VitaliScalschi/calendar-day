-- Rulează o dată pe baza existentă (ex.: psql -f patch_audiences_diacritics.sql).
-- Corectează denumiri fără diacritice / corupte din cauza encoding-ului la INSERT inițial.

UPDATE audiences
SET name = U&'Candida\021Bii independen\021Bi'
WHERE "key" = 'independent_candidates';

UPDATE audiences
SET name = U&'Autorit\0103\021Bi publice'
WHERE "key" = 'public_authorities';

UPDATE audiences
SET name = 'Publicul larg'
WHERE "key" = 'public';
