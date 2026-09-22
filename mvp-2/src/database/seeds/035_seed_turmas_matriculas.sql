-- Seed 035: Popula a turma das matrículas ativas que ainda não têm turma definida
-- Descrição: distribui os jovens de cada programa entre Turma 1, Turma 2 e Turma Remota
--            (round-robin por ordem de matrícula), só para representar melhor o sistema.
-- Seguro para rodar mais de uma vez: só afeta matrículas com turma IS NULL.
-- Dependências: 034_add_turma_matriculas.sql

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY programa_id ORDER BY id) AS rn
    FROM matriculas
    WHERE status = 'Ativo'
      AND turma IS NULL
)
UPDATE matriculas m
SET turma = CASE (r.rn - 1) % 3
    WHEN 0 THEN 'Turma 1'
    WHEN 1 THEN 'Turma 2'
    ELSE 'Turma Remota'
END
FROM ranked r
WHERE m.id = r.id;
