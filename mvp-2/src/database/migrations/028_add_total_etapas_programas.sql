-- Migration 028: Adiciona total de etapas na tabela programas
-- Descrição: Define quantas sessões compõem a jornada de mentoria de cada programa
-- Dependência: programas (003)

ALTER TABLE programas ADD COLUMN IF NOT EXISTS total_etapas INTEGER DEFAULT 5;
