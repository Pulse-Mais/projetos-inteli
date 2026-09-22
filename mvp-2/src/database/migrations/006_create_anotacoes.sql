-- Migration 006: Tabela de Anotações Qualitativas 
-- Descrição: Registros textuais vinculados ao jovem - mentorias, atendimentos, evolução geral etc
-- Dependências: jovens, usuarios 

CREATE TABLE IF NOT EXISTS anotacoes (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    autor_id INTEGER NOT NULL, -- Gerado automaticamente
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN (
        'Mentoria',
        'Atendimento',
        'Evolucao_Geral',
        'Academico',
        'Outro'
    )), -- Não inclui saúde mental (Separada em outra Tabela)

    -- Badge visual: ALERTA(vermelho), CONQUISTA(verde), GERAL(cinza)
    tipo_alerta VARCHAR(20) DEFAULT 'Geral' CHECK (tipo_alerta IN (
        'Alerta',
        'Conquista',
        'Geral'
    )),

    texto TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anotacoes_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
    CONSTRAINT fk_anotacoes_autor
        FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_jovens ON anotacoes(jovem_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_categoria ON anotacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo_alerta ON anotacoes(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_anotacoes_criado_em ON anotacoes(criado_em);

