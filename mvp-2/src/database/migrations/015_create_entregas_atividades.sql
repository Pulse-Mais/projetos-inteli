-- Migration 015: Entregas de Atividades
-- Tabela associativa que registra a entrega (ou ausência) de cada atividade e por jovem
-- Dependências: atividades (014), jovens (002)

CREATE TABLE IF NOT EXISTS entregas_atividades (
    id SERIAL PRIMARY KEY,
    atividades_id INTEGER NOT NULL,
    jovem_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN (
        'Entregue', 'Pendente', 'Atrasada'
    )),
    nota NUMERIC(4, 1), -- Ex.: 8.5, 10.0 - NULL se não avaliada
    data_entrega DATE, -- Data efetiva da entrega; NULL se pendente
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entrega_atividade
        FOREIGN KEY (atividades_id) REFERENCES atividades(id) ON DELETE CASCADE,
    CONSTRAINT fk_entregas_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,

    -- Um jovem não pode ter duas entregas para a mesma atividade
    CONSTRAINT uq_entrega_atividade_jovem
        UNIQUE (atividades_id, jovem_id)
);

-- Índice por jovem: "todas as entregas do jovem X" (ficha do aluno)
CREATE INDEX IF NOT EXISTS idx_entregas_jovem ON entregas_atividades(jovem_id);

-- Índice por atividade: "quem entregou a atividade Y" (visão do coordenador)
CREATE INDEX IF NOT EXISTS idx_entregas_atividades ON entregas_atividades(atividades_id);

-- Índice por status: contadores do dashboard (entregues, pendentes, atrasadas)
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas_atividades(status);