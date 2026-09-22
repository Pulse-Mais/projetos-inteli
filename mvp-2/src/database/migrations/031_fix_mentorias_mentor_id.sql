-- Migration 031: Garante colunas mentor_id e duracao_minutos em mentorias
-- A migration 017 falhou em ambientes com dados existentes por tentar NOT NULL sem default.
-- Esta migration adiciona as colunas de forma segura (nullable).

ALTER TABLE mentorias ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT;
ALTER TABLE mentorias ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mentorias_mentor_id ON mentorias(mentor_id);
