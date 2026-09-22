-- Migration 025: Adiciona código de matrícula na tabela matriculas
-- Descrição: Código no formato PM-{ano}-{sequencial} para identificação visual do jovem
-- Dependência: matriculas (004)

ALTER TABLE matriculas ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;
