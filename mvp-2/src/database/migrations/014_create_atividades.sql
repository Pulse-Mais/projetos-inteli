-- Migration 014: Atividades dos Programas
-- Registra atividades (tarefas, exercícios, projetos) vinculadas a um programa.
-- Dependência: programas (003)

CREATE TABLE IF NOT EXISTS atividades (
    id SERIAL PRIMARY KEY,
    programa_id INTEGER NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    data_limite DATE, -- Prazo de entrega; NULL = sem prazo
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_atividades_programa 
        FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE
);

--Índice por programa: lista de atividades de um programa específico
CREATE INDEX IF NOT EXISTS idx_atividades_programa ON atividades(programa_id);

-- Índice por prazo: consultas de atividades próximas do vencimento / vencidas
CREATE INDEX IF NOT EXISTS idx_atividades_data_limite ON atividades(data_limite);