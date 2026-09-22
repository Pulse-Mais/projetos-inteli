-- Migration 009: Tabela de Participação em Eventos
-- Descrição: Associação N:N entre Jovem e Evento
-- Dependência: jovens, eventos

CREATE TABLE IF NOT EXISTS participacoes_eventos (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    evento_id INTEGER NOT NULL,
    presente BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_part_evento_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT fk_part_evento_evento
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT uq_participacao_jovem_evento
        UNIQUE (jovem_id, evento_id) -- Impede registro duplicado
);

CREATE INDEX IF NOT EXISTS idx_part_evento_jovem ON participacoes_eventos(jovem_id);
CREATE INDEX IF NOT EXISTS idx_part_evento_evento ON participacoes_eventos(evento_id);
