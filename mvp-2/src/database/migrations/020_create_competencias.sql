-- Migration 020: Tabela de Competências
-- Descrição: Habilidades técnicas e não-técnicas do jovem (cursos, eventos, certificações)
-- Dependência: jovens (002)

CREATE TABLE IF NOT EXISTS competencias (
    id SERIAL PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Competencia', 'Curso', 'Evento', 'Certificacao')),
    nivel VARCHAR(30) CHECK (nivel IN ('Basico', 'Intermediario', 'Avancado')),
    instituicao VARCHAR(200),
    carga_horaria VARCHAR(30),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_competencias_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_competencias_jovem ON competencias(jovem_id);
CREATE INDEX IF NOT EXISTS idx_competencias_tipo ON competencias(tipo);