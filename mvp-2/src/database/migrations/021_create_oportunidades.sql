-- Migration 021: Tabela de Oportunidades
-- Descrição: Catálogo de cursos, eventos e bolsas externas disponíveis para os jovens
-- Dependência: nenhuma (catálogo independente)

CREATE TABLE IF NOT EXISTS oportunidades (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Curso', 'Evento', 'Bolsa')),
    titulo VARCHAR(300) NOT NULL,
    instituicao VARCHAR(200),
    descricao TEXT,
    local VARCHAR(200),
    data_inicio DATE,
    data_fim DATE,
    duracao VARCHAR(50),
    vagas INTEGER,
    valor VARCHAR(50),
    modalidade VARCHAR(30) CHECK (modalidade IN ('Online', 'Presencial', 'Hibrido')),
    link VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oportunidades_tipo ON oportunidades(tipo);
CREATE INDEX IF NOT EXISTS idx_oportunidades_ativo ON oportunidades(ativo);