-- Migration 027: Adiciona data de início de mentoria na tabela usuarios
-- Descrição: Registra quando o usuário com perfil Mentor começou a atuar no programa
-- Dependência: usuarios (001)

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_inicio_mentoria DATE;
