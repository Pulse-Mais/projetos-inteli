-- Migration 008: Tabela de Eventos
-- Descrição: Eventos institucionais - Eventos Tech, Pulse+, encontro da rede
-- Dependências: nenhuma

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY ,
    nome VARCHAR(200) NOT NULL,
    data_inicio TIMESTAMP NOT NULL, -- Data + hora início
    data_fim TIMESTAMP, -- Data + hora fim
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'Eventos_Tech',
        'Pulse_Mais',
        'Encontro_Rede',
        'Workshop',
        'Palestra',
        'Outro'
    )),
    descricao TEXT,
    local VARCHAR(200),
    vagas INTEGER, -- Capacidade máxima (ex.: 120)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);