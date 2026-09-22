-- Migration 030: Adiciona token_version para suportar logout-all
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
