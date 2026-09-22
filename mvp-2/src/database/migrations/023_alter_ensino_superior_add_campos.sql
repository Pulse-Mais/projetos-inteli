-- Migration 023: Adiciona semestre_atual e numero_matricula_ies na tabela ensino_superior
-- Descrição: Campos detalhados do vínculo do jovem com a IES
-- Dependência: ensino_superior (012)

ALTER TABLE ensino_superior ADD COLUMN IF NOT EXISTS semestre_atual        VARCHAR(10);
ALTER TABLE ensino_superior ADD COLUMN IF NOT EXISTS numero_matricula_ies  VARCHAR(30);
