-- Migration 04: Tabela de Matrículas 
-- Descrição: Associação N:N entre Jovem e Programa, com status de aprovação. Registra o histórico de transições da jornada.
-- Dependências: jovens, programas

CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    programa_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Ativo' CHECK (status IN (
        'Ativo',
        'Concluido',
        'Evadido',
        'Trancado'
    )),

    data_matricula DATE DEFAULT CURRENT_DATE,
    data_conclusao DATE,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_matriculas_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT fk_matriculas_programa
        FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE RESTRICT,
    CONSTRAINT uq_matricula_jovem_programa
        UNIQUE (jovem_id, programa_id) -- Evita matrícula duplicada
);

CREATE INDEX IF NOT EXISTS idx_matriculas_jovem ON matriculas(jovem_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_programa ON matriculas(programa_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);