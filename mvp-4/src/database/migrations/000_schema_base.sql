-- 000_schema_base.sql
-- Schema base executável para o PostgreSQL local do MVP 4.
-- Deve ser executado antes de 001_diagrama_dominio.sql.

BEGIN;

-- Sequências
CREATE SEQUENCE IF NOT EXISTS turma_id_turma_seq;
CREATE SEQUENCE IF NOT EXISTS aluno_ra_seq;
CREATE SEQUENCE IF NOT EXISTS aula_id_aula_seq;
CREATE SEQUENCE IF NOT EXISTS coordenador_id_turma_seq;
CREATE SEQUENCE IF NOT EXISTS gestor_rm_seq;
CREATE SEQUENCE IF NOT EXISTS psicologo_rm_seq;
CREATE SEQUENCE IF NOT EXISTS alerta_id_alerta_seq;
CREATE SEQUENCE IF NOT EXISTS certificado_id_certificado_seq;
CREATE SEQUENCE IF NOT EXISTS empregabilidade_id_emprego_seq;
CREATE SEQUENCE IF NOT EXISTS evento_id_evento_seq;
CREATE SEQUENCE IF NOT EXISTS relatorio_id_relatorio_seq;

-- Tabelas sem dependências
CREATE TABLE IF NOT EXISTS turma (
  id_turma INTEGER NOT NULL DEFAULT nextval('turma_id_turma_seq'),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  nome_turma VARCHAR NOT NULL,
  CONSTRAINT turma_pkey PRIMARY KEY (id_turma)
);

CREATE TABLE IF NOT EXISTS aula (
  professor VARCHAR NOT NULL,
  id_aula INTEGER NOT NULL DEFAULT nextval('aula_id_aula_seq'),
  tema VARCHAR NOT NULL,
  data DATE NOT NULL,
  CONSTRAINT aula_pkey PRIMARY KEY (id_aula)
);

CREATE TABLE IF NOT EXISTS gestor (
  rm INTEGER NOT NULL DEFAULT nextval('gestor_rm_seq'),
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  CONSTRAINT gestor_pkey PRIMARY KEY (rm)
);

CREATE TABLE IF NOT EXISTS psicologo (
  rm INTEGER NOT NULL DEFAULT nextval('psicologo_rm_seq'),
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  cargo VARCHAR NOT NULL,
  CONSTRAINT psicologo_pkey PRIMARY KEY (rm)
);

CREATE TABLE IF NOT EXISTS evento (
  id_evento INTEGER NOT NULL DEFAULT nextval('evento_id_evento_seq'),
  sede VARCHAR NOT NULL,
  data DATE NOT NULL,
  categoria VARCHAR NOT NULL,
  tema VARCHAR NOT NULL,
  descricao VARCHAR,
  CONSTRAINT evento_pkey PRIMARY KEY (id_evento)
);

-- Aluno depende de turma.
CREATE TABLE IF NOT EXISTS aluno (
  ra INTEGER NOT NULL DEFAULT nextval('aluno_ra_seq'),
  data_nasc DATE NOT NULL,
  status BOOLEAN NOT NULL,
  email_primario VARCHAR NOT NULL UNIQUE,
  email_secundario VARCHAR,
  cpf VARCHAR NOT NULL UNIQUE,
  tel_primario VARCHAR NOT NULL,
  tel_secundario VARCHAR,
  genero VARCHAR NOT NULL,
  data_ingresso DATE NOT NULL,
  nome VARCHAR NOT NULL,
  categoria VARCHAR NOT NULL,
  fotos VARCHAR,
  id_turma INTEGER,
  ex_aluno BOOLEAN NOT NULL DEFAULT false,
  data_conclusao DATE,
  nivel_formacao VARCHAR,
  CONSTRAINT aluno_pkey PRIMARY KEY (ra),
  CONSTRAINT fk_aluno_turma
    FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
);

-- Coordenador mantém a estrutura original do dump.
CREATE TABLE IF NOT EXISTS coordenador (
  id_turma INTEGER NOT NULL DEFAULT nextval('coordenador_id_turma_seq'),
  rm INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  CONSTRAINT coordenador_pkey PRIMARY KEY (id_turma),
  CONSTRAINT fk_coordenador_turma
    FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
);

-- Tabelas de relacionamento.
CREATE TABLE IF NOT EXISTS contem (
  id_turma INTEGER NOT NULL,
  id_aula INTEGER NOT NULL,
  CONSTRAINT contem_pkey PRIMARY KEY (id_turma, id_aula),
  CONSTRAINT fk_contem_turma
    FOREIGN KEY (id_turma) REFERENCES turma(id_turma),
  CONSTRAINT fk_contem_aula
    FOREIGN KEY (id_aula) REFERENCES aula(id_aula)
);

CREATE TABLE IF NOT EXISTS frequenta (
  id_aluno INTEGER NOT NULL,
  id_aula INTEGER NOT NULL,
  data DATE NOT NULL,
  frequencia BOOLEAN NOT NULL,
  CONSTRAINT frequenta_pkey PRIMARY KEY (id_aluno, id_aula),
  CONSTRAINT fk_frequenta_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra),
  CONSTRAINT fk_frequenta_aula
    FOREIGN KEY (id_aula) REFERENCES aula(id_aula)
);

CREATE TABLE IF NOT EXISTS participa (
  id_aluno INTEGER NOT NULL,
  id_evento INTEGER NOT NULL,
  data DATE NOT NULL,
  frequencia BOOLEAN,
  CONSTRAINT participa_pkey PRIMARY KEY (id_aluno, id_evento),
  CONSTRAINT fk_participa_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra),
  CONSTRAINT fk_participa_evento
    FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
);

CREATE TABLE IF NOT EXISTS certificado (
  id_certificado INTEGER NOT NULL DEFAULT nextval('certificado_id_certificado_seq'),
  nome VARCHAR NOT NULL,
  data DATE NOT NULL,
  id_aluno INTEGER,
  CONSTRAINT certificado_pkey PRIMARY KEY (id_certificado),
  CONSTRAINT fk_certificado_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra)
);

CREATE TABLE IF NOT EXISTS empregabilidade (
  id_aluno INTEGER,
  id_emprego INTEGER NOT NULL DEFAULT nextval('empregabilidade_id_emprego_seq'),
  empresa VARCHAR NOT NULL,
  data_inicio DATE NOT NULL,
  data_encerramento DATE,
  faixa_salarial VARCHAR NOT NULL,
  cargo VARCHAR NOT NULL,
  CONSTRAINT empregabilidade_pkey PRIMARY KEY (id_emprego),
  CONSTRAINT fk_empregabilidade_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra)
);

CREATE TABLE IF NOT EXISTS relatorio (
  info_simplificada VARCHAR NOT NULL,
  id_relatorio INTEGER NOT NULL DEFAULT nextval('relatorio_id_relatorio_seq'),
  observacoes VARCHAR NOT NULL,
  data DATE NOT NULL,
  id_aluno INTEGER,
  id_psicologo INTEGER,
  CONSTRAINT relatorio_pkey PRIMARY KEY (id_relatorio),
  CONSTRAINT fk_relatorio_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra),
  CONSTRAINT fk_relatorio_psicologo
    FOREIGN KEY (id_psicologo) REFERENCES psicologo(rm)
);

CREATE TABLE IF NOT EXISTS alerta (
  id_alerta INTEGER NOT NULL DEFAULT nextval('alerta_id_alerta_seq'),
  tipo INTEGER NOT NULL CHECK (tipo > 0),
  data_inicio DATE NOT NULL,
  motivo VARCHAR,
  status VARCHAR NOT NULL,
  id_aluno INTEGER,
  id_gestor INTEGER,
  CONSTRAINT alerta_pkey PRIMARY KEY (id_alerta),
  CONSTRAINT fk_alerta_aluno
    FOREIGN KEY (id_aluno) REFERENCES aluno(ra),
  CONSTRAINT fk_alerta_gestor
    FOREIGN KEY (id_gestor) REFERENCES gestor(rm)
);

-- Ajusta as sequências para continuar depois de IDs eventualmente existentes.
SELECT setval(
  'turma_id_turma_seq',
  COALESCE((SELECT MAX(id_turma) FROM turma), 1),
  EXISTS (SELECT 1 FROM turma)
);

SELECT setval(
  'aluno_ra_seq',
  COALESCE((SELECT MAX(ra) FROM aluno), 1),
  EXISTS (SELECT 1 FROM aluno)
);

SELECT setval(
  'aula_id_aula_seq',
  COALESCE((SELECT MAX(id_aula) FROM aula), 1),
  EXISTS (SELECT 1 FROM aula)
);

SELECT setval(
  'coordenador_id_turma_seq',
  COALESCE((SELECT MAX(id_turma) FROM coordenador), 1),
  EXISTS (SELECT 1 FROM coordenador)
);

SELECT setval(
  'gestor_rm_seq',
  COALESCE((SELECT MAX(rm) FROM gestor), 1),
  EXISTS (SELECT 1 FROM gestor)
);

SELECT setval(
  'psicologo_rm_seq',
  COALESCE((SELECT MAX(rm) FROM psicologo), 1),
  EXISTS (SELECT 1 FROM psicologo)
);

SELECT setval(
  'alerta_id_alerta_seq',
  COALESCE((SELECT MAX(id_alerta) FROM alerta), 1),
  EXISTS (SELECT 1 FROM alerta)
);

SELECT setval(
  'certificado_id_certificado_seq',
  COALESCE((SELECT MAX(id_certificado) FROM certificado), 1),
  EXISTS (SELECT 1 FROM certificado)
);

SELECT setval(
  'empregabilidade_id_emprego_seq',
  COALESCE((SELECT MAX(id_emprego) FROM empregabilidade), 1),
  EXISTS (SELECT 1 FROM empregabilidade)
);

SELECT setval(
  'evento_id_evento_seq',
  COALESCE((SELECT MAX(id_evento) FROM evento), 1),
  EXISTS (SELECT 1 FROM evento)
);

SELECT setval(
  'relatorio_id_relatorio_seq',
  COALESCE((SELECT MAX(id_relatorio) FROM relatorio), 1),
  EXISTS (SELECT 1 FROM relatorio)
);

COMMIT;