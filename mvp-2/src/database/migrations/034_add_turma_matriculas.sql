-- Migration 034: Adiciona turma à matrícula
-- Descrição: Permite agrupar alunos de um mesmo programa em Turma 1, Turma 2 ou Turma Remota
-- Dependências: matriculas

ALTER TABLE matriculas
    ADD COLUMN turma VARCHAR(20) CHECK (turma IN ('Turma 1', 'Turma 2', 'Turma Remota'));

CREATE INDEX IF NOT EXISTS idx_matriculas_turma ON matriculas(turma);
