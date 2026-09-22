-- Migration 022: Tabela de Certificados
-- Descrição: Certificados obtidos pelo jovem em cursos e formações
-- Dependência: jovens (002)

CREATE TABLE IF NOT EXISTS certificados (
    id SERIAL  PRIMARY KEY,
    jovem_id INTEGER NOT NULL,
    nome VARCHAR(300) NOT NULL,
    instituicao VARCHAR(200),
    data_conclusao DATE,
    link_documento VARCHAR(500),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_certificados_jovem
        FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_certificados_jovem ON certificados(jovem_id);
