-- Migration 007: Tabela de Atendimento de Saúde Mental
-- Descrição: Segregada da Anotação por exigência de acesso restrito
-- Dependência: jovens, usuarios

CREATE TABLE IF NOT EXISTS atendimentos_saude_mental (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    profissional_id INTEGER NOT NULL, -- Quem realizou o atendimento
    data_atendimento DATE NOT NULL,
    resumo TEXT NOT NULL, -- Conteúdo do atendimento 
    encaminhamento TEXT, -- Ação sugerida
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_atend_sm_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT fk_atend_sm_profissional
        FOREIGN KEY (profissional_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_atend_sm_jovem ON atendimentos_saude_mental(jovem_id);