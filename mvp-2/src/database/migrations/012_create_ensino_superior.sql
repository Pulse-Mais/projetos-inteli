-- Migration 012: Tabela de Ensino de Superior 
-- Descrição: situação acadêmica do jovem em nível superior 
-- Dependências: jovens

CREATE TABLE IF NOT EXISTS ensino_superior (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    instituicao VARCHAR(200) NOT NULL,
    cursos VARCHAR(200) NOT NULL,
    modalidade_bolsa VARCHAR(50) CHECK (modalidade_bolsa IN (
        'Integral',
        'Parcial',
        'ProUni',
        'FIES',
        'Institucional',
        'Sem_bolsa',
        'Outra'
    )),
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'Cursando',
        'Trancado',
        'Concluido',
        'Desistente'
    )),
    data_inicio DATE,
    data_conclusao DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ensino_superior_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE 
);

CREATE INDEX IF NOT EXISTS idx_ensino_superior_jovem ON ensino_superior(jovem_id);
CREATE INDEX IF NOT EXISTS idx_ensino_superior_status ON ensino_superior(status);