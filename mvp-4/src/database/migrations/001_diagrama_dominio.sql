-- Evolucao aditiva baseada no diagrama de classes de dominio.
-- Mantem colunas legadas usadas pelo backend para evitar regressao.

ALTER TABLE aluno
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS endereco VARCHAR(200),
  ADD COLUMN IF NOT EXISTS renda_familiar NUMERIC(12,2);

ALTER TABLE turma
  ADD COLUMN IF NOT EXISTS capacidade INT CHECK (capacidade > 0),
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ativa'
    CHECK (status IN ('ativa', 'encerrada', 'suspensa'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_coordenador_rm_unique
  ON coordenador(rm);

ALTER TABLE turma
  ADD COLUMN IF NOT EXISTS id_coordenador INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_turma_coordenador'
  ) THEN
    ALTER TABLE turma
      ADD CONSTRAINT fk_turma_coordenador
      FOREIGN KEY (id_coordenador) REFERENCES coordenador(rm)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE alerta
  ADD COLUMN IF NOT EXISTS data_resolucao DATE;

-- O backend ja utiliza data_encerramento. data_termino e exposto pelos
-- endpoints como alias para manter compatibilidade com o diagrama.

CREATE TABLE IF NOT EXISTS comunicado (
  id_comunicado SERIAL PRIMARY KEY,
  sede VARCHAR(200),
  data_acontecer DATE,
  categoria VARCHAR(100),
  tema VARCHAR(200),
  descricao TEXT,
  enviado_por INT,
  data_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  titulo VARCHAR(100),
  conteudo TEXT,
  destinatarios VARCHAR(20),
  total_destinatarios INT NOT NULL DEFAULT 0
);

ALTER TABLE comunicado
  ADD COLUMN IF NOT EXISTS sede VARCHAR(200),
  ADD COLUMN IF NOT EXISTS data_acontecer DATE,
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tema VARCHAR(200),
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS enviado_por INT,
  ADD COLUMN IF NOT EXISTS data_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS conteudo TEXT,
  ADD COLUMN IF NOT EXISTS destinatarios VARCHAR(20),
  ADD COLUMN IF NOT EXISTS total_destinatarios INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS anotacoes (
  id_anotacoes SERIAL PRIMARY KEY,
  id_aluno INT NOT NULL,
  nome_autor VARCHAR(150) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  conteudo TEXT NOT NULL,
  CONSTRAINT fk_anotacoes_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_aluno
  ON anotacoes(id_aluno);
