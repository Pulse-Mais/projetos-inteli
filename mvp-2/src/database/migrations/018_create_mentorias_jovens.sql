-- Migration 018: Tabela associativa Mentorias ↔ Jovens
-- Descrição: Relação N:N — uma sessão de mentoria pode ter múltiplos jovens
-- Dependência: mentorias (010), jovens (002)

CREATE TABLE IF NOT EXISTS mentorias_jovens (
    id SERIAL PRIMARY KEY,
    mentoria_id INTEGER NOT NULL,
    jovem_id INTEGER NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentorias_jovens_mentorias
        FOREIGN KEY (mentoria_id) REFERENCES mentorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentorias_jovens_jovem
        FOREIGN KEY (jovem_id)REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT uq_mentoria_jovem
        UNIQUE (mentoria_id, jovem_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorias_jovens_mentoria ON mentorias_jovens(mentoria_id);
CREATE INDEX IF NOT EXISTS idx_mentorias_jovens_jovem ON mentorias_jovens(jovem_id);