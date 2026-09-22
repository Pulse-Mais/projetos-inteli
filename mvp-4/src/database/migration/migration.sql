-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alerta (
  id_alerta integer NOT NULL DEFAULT nextval('alerta_id_alerta_seq'::regclass),
  tipo integer NOT NULL CHECK (tipo > 0),
  data_inicio date NOT NULL,
  motivo character varying,
  status character varying NOT NULL,
  id_aluno integer,
  id_gestor integer,
  CONSTRAINT alerta_pkey PRIMARY KEY (id_alerta),
  CONSTRAINT fk_alerta_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra),
  CONSTRAINT fk_alerta_gestor FOREIGN KEY (id_gestor) REFERENCES public.gestor(rm)
);
CREATE TABLE public.aluno (
  ra integer NOT NULL DEFAULT nextval('aluno_ra_seq'::regclass),
  data_nasc date NOT NULL,
  status boolean NOT NULL,
  email_primario character varying NOT NULL UNIQUE,
  email_secundario character varying,
  cpf character varying NOT NULL UNIQUE,
  tel_primario character varying NOT NULL,
  tel_secundario character varying,
  genero character varying NOT NULL,
  data_ingresso date NOT NULL,
  nome character varying NOT NULL,
  categoria character varying NOT NULL,
  fotos character varying,
  id_turma integer,
  ex_aluno boolean NOT NULL DEFAULT false,
  data_conclusao date,
  nivel_formacao character varying,
  CONSTRAINT aluno_pkey PRIMARY KEY (ra),
  CONSTRAINT fk_aluno_turma FOREIGN KEY (id_turma) REFERENCES public.turma(id_turma)
);
CREATE TABLE public.aula (
  professor character varying NOT NULL,
  id_aula integer NOT NULL DEFAULT nextval('aula_id_aula_seq'::regclass),
  tema character varying NOT NULL,
  data date NOT NULL,
  CONSTRAINT aula_pkey PRIMARY KEY (id_aula)
);
CREATE TABLE public.certificado (
  id_certificado integer NOT NULL DEFAULT nextval('certificado_id_certificado_seq'::regclass),
  nome character varying NOT NULL,
  data date NOT NULL,
  id_aluno integer,
  CONSTRAINT certificado_pkey PRIMARY KEY (id_certificado),
  CONSTRAINT fk_certificado_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra)
);
CREATE TABLE public.contem (
  id_turma integer NOT NULL,
  id_aula integer NOT NULL,
  CONSTRAINT contem_pkey PRIMARY KEY (id_turma, id_aula),
  CONSTRAINT fk_contem_turma FOREIGN KEY (id_turma) REFERENCES public.turma(id_turma),
  CONSTRAINT fk_contem_aula FOREIGN KEY (id_aula) REFERENCES public.aula(id_aula)
);
CREATE TABLE public.coordenador (
  id_turma integer NOT NULL DEFAULT nextval('coordenador_id_turma_seq'::regclass),
  rm integer NOT NULL,
  nome character varying NOT NULL,
  email character varying NOT NULL,
  CONSTRAINT coordenador_pkey PRIMARY KEY (id_turma),
  CONSTRAINT fk_coordenador_turma FOREIGN KEY (id_turma) REFERENCES public.turma(id_turma)
);
CREATE TABLE public.empregabilidade (
  id_aluno integer,
  id_emprego integer NOT NULL DEFAULT nextval('empregabilidade_id_emprego_seq'::regclass),
  empresa character varying NOT NULL,
  data_inicio date NOT NULL,
  data_encerramento date,
  faixa_salarial character varying NOT NULL,
  cargo character varying NOT NULL,
  CONSTRAINT empregabilidade_pkey PRIMARY KEY (id_emprego),
  CONSTRAINT fk_empregabilidade_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra)
);
CREATE TABLE public.evento (
  id_evento integer NOT NULL DEFAULT nextval('evento_id_evento_seq'::regclass),
  sede character varying NOT NULL,
  data date NOT NULL,
  categoria character varying NOT NULL,
  tema character varying NOT NULL,
  descricao character varying,
  CONSTRAINT evento_pkey PRIMARY KEY (id_evento)
);
CREATE TABLE public.frequenta (
  id_aluno integer NOT NULL,
  id_aula integer NOT NULL,
  data date NOT NULL,
  frequencia boolean NOT NULL,
  CONSTRAINT frequenta_pkey PRIMARY KEY (id_aluno, id_aula),
  CONSTRAINT fk_frequenta_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra),
  CONSTRAINT fk_frequenta_aula FOREIGN KEY (id_aula) REFERENCES public.aula(id_aula)
);
CREATE TABLE public.gestor (
  rm integer NOT NULL DEFAULT nextval('gestor_rm_seq'::regclass),
  nome character varying NOT NULL,
  email character varying NOT NULL,
  CONSTRAINT gestor_pkey PRIMARY KEY (rm)
);
CREATE TABLE public.participa (
  id_aluno integer NOT NULL,
  id_evento integer NOT NULL,
  data date NOT NULL,
  frequencia boolean,
  CONSTRAINT participa_pkey PRIMARY KEY (id_aluno, id_evento),
  CONSTRAINT fk_participa_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra),
  CONSTRAINT fk_participa_evento FOREIGN KEY (id_evento) REFERENCES public.evento(id_evento)
);
CREATE TABLE public.psicologo (
  rm integer NOT NULL DEFAULT nextval('psicologo_rm_seq'::regclass),
  nome character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  cargo character varying NOT NULL,
  CONSTRAINT psicologo_pkey PRIMARY KEY (rm)
);
CREATE TABLE public.relatorio (
  info_simplificada character varying NOT NULL,
  id_relatorio integer NOT NULL DEFAULT nextval('relatorio_id_relatorio_seq'::regclass),
  observacoes character varying NOT NULL,
  data date NOT NULL,
  id_aluno integer,
  id_psicologo integer,
  CONSTRAINT relatorio_pkey PRIMARY KEY (id_relatorio),
  CONSTRAINT fk_relatorio_aluno FOREIGN KEY (id_aluno) REFERENCES public.aluno(ra),
  CONSTRAINT fk_relatorio_psicologo FOREIGN KEY (id_psicologo) REFERENCES public.psicologo(rm)
);
CREATE TABLE public.turma (
  id_turma integer NOT NULL DEFAULT nextval('turma_id_turma_seq'::regclass),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  nome_turma character varying NOT NULL,
  CONSTRAINT turma_pkey PRIMARY KEY (id_turma)
);
