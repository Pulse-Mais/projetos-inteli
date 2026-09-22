-- Migration 011: Tabela de Empregabilidade
-- Descrição: Situação profissional do jovem
-- Dependências: jovens

CREATE TABLE IF NOT EXISTS empregabilidade (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    empresa VARCHAR(200) NOT NULL,
    cargo VARCHAR(150),
    data_admissao DATE,
    data_saida DATE,
    faixa_salarial VARCHAR(50) CHECK (faixa_salarial IN (
        'Ate_1_SM',
        '1_a_2_SM',
        '2_a_3_SM',
        '3_a_5_SM',
        'Acima_5_SM',
        'Nao_informado'
    )),
    tipo_vinculo VARCHAR(30) CHECK (tipo_vinculo IN (
        'CLT',
        'Estagio',
        'PJ',
        'Freelancer',
        'Informal',
        'Jovem_Aprendiz',
        'Outro'
    )),
    area_tech BOOLEAN DEFAULT FALSE, -- tech ou não-tech
    modalidade VARCHAR(30) CHECK (modalidade IN (
        'Presencial', 'Remoto', 'Hibrido'
    )),
    carga_horaria_semanal VARCHAR(30), -- Ex.: "30h/sem"
    ativo BOOLEAN DEFAULT TRUE, -- Emprego atual?
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_empregabilidade_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_empregabilidade_jovem ON empregabilidade(jovem_id);
CREATE INDEX IF NOT EXISTS idx_empregabilidade_ativo ON empregabilidade(ativo);