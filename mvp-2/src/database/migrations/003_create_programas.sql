-- Migration 003: Tabela de Programas 
-- Descrição: Programas oferecidos pela Pulse Mais (cursos, mentorias estruturadas, projetos). Agregação com Matrícula
-- Dependência: nenhuma

CREATE TABLE IF NOT EXISTS programas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    ano INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'Curso',
        'Mentoria',
        'Projeto',
        'Evento_Recorrente'
    )),
    carga_horaria INTEGER, -- Em horas 
    coorte VARCHAR(20), -- Ex.:"2025.2", "2026.1" (filtros no protótipo)
    data_inicio DATE, -- Inicio período/coorte
    data_fim DATE, -- Fim do período/coorte
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_programas_ano ON programas(ano);
CREATE INDEX IF NOT EXISTS idx_programas_tipo ON programas(tipo);
CREATE INDEX IF NOT EXISTS idx_programas_coorte ON programas(coorte);