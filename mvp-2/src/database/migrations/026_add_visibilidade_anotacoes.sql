-- Migration 026: Adiciona controle de visibilidade ao mentor na tabela anotacoes
-- Descrição: Permite que a Coordenação marque quais anotações são visíveis para Mentores
-- Dependência: anotacoes (006)

ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS visivel_mentor BOOLEAN DEFAULT FALSE;
