-- Migration 019: Adiciona coluna temas na tabela mentorias
-- Descrição: Array de temas abordados em cada sessão (Carreira, Programacao, Soft Skills, Empregabilidade)
-- Dependência: mentorias (010)

ALTER TABLE mentorias ADD COLUMN IF NOT EXISTS temas TEXT[] DEFAULT '{}';
