CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE aluno ADD COLUMN IF NOT EXISTS senha_hash TEXT;
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS senha_hash TEXT;
ALTER TABLE gestor ADD COLUMN IF NOT EXISTS senha_hash TEXT;
ALTER TABLE psicologo ADD COLUMN IF NOT EXISTS senha_hash TEXT;

UPDATE aluno
SET senha_hash = crypt('Nexus@' || ra::TEXT, gen_salt('bf', 12))
WHERE senha_hash IS NULL;

UPDATE coordenador
SET senha_hash = crypt('Nexus@' || rm::TEXT, gen_salt('bf', 12))
WHERE senha_hash IS NULL;

UPDATE gestor
SET senha_hash = crypt('Nexus@' || rm::TEXT, gen_salt('bf', 12))
WHERE senha_hash IS NULL;

UPDATE psicologo
SET senha_hash = crypt('Nexus@' || rm::TEXT, gen_salt('bf', 12))
WHERE senha_hash IS NULL;

ALTER TABLE aluno ALTER COLUMN senha_hash SET NOT NULL;
ALTER TABLE coordenador ALTER COLUMN senha_hash SET NOT NULL;
ALTER TABLE gestor ALTER COLUMN senha_hash SET NOT NULL;
ALTER TABLE psicologo ALTER COLUMN senha_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_email_login
  ON aluno (LOWER(email_primario));
CREATE UNIQUE INDEX IF NOT EXISTS idx_coordenador_email_login
  ON coordenador (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_gestor_email_login
  ON gestor (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_psicologo_email_login
  ON psicologo (LOWER(email));
