-- Migration 010: Tabela de Mentorias
-- Descrição: Sessões individuais de mentoria 
-- Dependência : jovens, usuarios

CREATE TABLE IF NOT EXISTS mentorias (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL, -- Mentorado
    nome_mentoria VARCHAR(150) NOT NULL,
    status_mentoria VARCHAR(30) NOT NULL,
    mentor VARCHAR(150) NOT NULL,
    data_mentoria DATE NOT NULL,
    tempo_mentoria VARCHAR(10) NOT NULL,
    carga_horaria_mentoria NUMERIC(5,2) NOT NULL,
    observacao_mentoria TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentorias_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT chk_mentorias_status
        CHECK (status_mentoria IN ('Agendada', 'Realizada', 'Cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_mentorias_jovem ON mentorias(jovem_id);
CREATE INDEX IF NOT EXISTS idx_mentorias_mentor ON mentorias(mentor);
CREATE INDEX IF NOT EXISTS idx_mentorias_data ON mentorias(data_mentoria);
