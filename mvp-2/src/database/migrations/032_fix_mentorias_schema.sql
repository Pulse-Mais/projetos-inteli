-- Migration 032: Corrige schema de mentorias
-- A migration 017 falhou inteiramente (colunas antigas ainda existem com NOT NULL).
-- Esta migration remove as colunas legadas e mantém o schema normalizado.

ALTER TABLE mentorias DROP COLUMN IF EXISTS jovem_id;
ALTER TABLE mentorias DROP COLUMN IF EXISTS nome_mentoria;
ALTER TABLE mentorias DROP COLUMN IF EXISTS mentor;
ALTER TABLE mentorias DROP COLUMN IF EXISTS tempo_mentoria;
ALTER TABLE mentorias DROP COLUMN IF EXISTS carga_horaria_mentoria;
