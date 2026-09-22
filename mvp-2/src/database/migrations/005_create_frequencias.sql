-- Migration 005: Tabela de Frequência 
-- Descrição: Registro de presença em aulas, eventos e mentorias 
-- Dependência: jovens, usuarios 

CREATE TABLE IF NOT EXISTS frequencia (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    data_aula DATE NOT NULL, -- Obrigatório
    tipo_presenca VARCHAR(20) NOT NULL CHECK (tipo_presenca IN (
        'Presencial',
        'Gravacao',
        'Ausente'
    )),

    responsavel_id INTEGER NOT NULL, -- Quem registrou (usuario)
    programa_id INTEGER, -- A qual programa pertence esta frequência 
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_frequencias_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT fk_frequencias_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_frequencia_programa
        FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE 
);

CREATE INDEX IF NOT EXISTS idx_frequencias_jovem ON frequencia(jovem_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_data_aula ON frequencia(data_aula);
CREATE INDEX IF NOT EXISTS idx_frequencias_programa ON frequencia(programa_id);