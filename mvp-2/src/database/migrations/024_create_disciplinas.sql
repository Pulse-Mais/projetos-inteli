-- Migration 024: Tabela de Disciplinas
-- Descrição: Histórico acadêmico detalhado do jovem no ensino superior
-- Dependência: ensino_superior (012)

CREATE TABLE IF NOT EXISTS disciplinas (
    id SERIAL  PRIMARY KEY,
    ensino_superior_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    status VARCHAR(30)  NOT NULL CHECK (status IN ('Aprovado', 'Reprovado', 'Em_andamento', 'Trancado')),
    semestre VARCHAR(10),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_disciplinas_ensino_superior
        FOREIGN KEY (ensino_superior_id) REFERENCES ensino_superior(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_ensino_superior ON disciplinas(ensino_superior_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_status ON disciplinas(status);
