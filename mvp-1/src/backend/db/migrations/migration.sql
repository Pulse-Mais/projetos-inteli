
-- BLOCO 1: tabelas base (cadastros principais, sem dependencias)


-- Tabela usuario: guarda dados basicos do usuario
CREATE TABLE usuario (
  id_usuario SERIAL        PRIMARY KEY,
  nome       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL,
  senha      VARCHAR(255)  NOT NULL,
  cpf        VARCHAR(11)   NOT NULL,
  foto_url   TEXT,
  CONSTRAINT uq_usuario_email UNIQUE (email),
  CONSTRAINT uq_usuario_cpf   UNIQUE (cpf)
);

-- Tabela programa: programas com datas de inicio e fim
-- A relacao com indicador e atividade e 1:N e esta representada nas tabelas
-- filhas (indicador.id_programa e atividade.id_programa). Programa NAO precisa
-- de FKs de volta para evitar dependencia circular no momento do INSERT.
CREATE TABLE programa (
  id_programa  SERIAL        PRIMARY KEY,
  titulo       VARCHAR(150)  NOT NULL,
  inicio       DATE          NOT NULL,
  fim          DATE          NOT NULL,
  CONSTRAINT chk_programa_periodo CHECK (fim >= inicio)
);

-- Tabela indicador: criterios vinculados ao programa
CREATE TABLE indicador (
  id_indicador SERIAL        PRIMARY KEY,
  nome         VARCHAR(100)  NOT NULL,
  descricao    TEXT,
  id_programa  INT           NOT NULL,
  CONSTRAINT fk_indicador_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE
);

-- Tabela atividade: atividades vinculadas ao programa
CREATE TABLE atividade (
  id_atividade  SERIAL        PRIMARY KEY,
  nome          VARCHAR(100)  NOT NULL,
  descricao     TEXT,
  data_entrega  DATE          NOT NULL,
  id_programa   INT           NOT NULL,
  CONSTRAINT fk_atividade_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE
);

-- Tabela evento: eventos com data e local
CREATE TABLE evento (
  id_evento SERIAL        PRIMARY KEY,
  nome      VARCHAR(150)  NOT NULL,
  data      TIMESTAMP     NOT NULL,
  local     VARCHAR(200)  NOT NULL
);

-- Tabela mentoria: encontros com formato, tema, duracao e data
CREATE TABLE mentoria (
  id_mentoria SERIAL        PRIMARY KEY,
  formato     VARCHAR(50)   NOT NULL,
  tema        VARCHAR(100)  NOT NULL,
  duracao     INT           NOT NULL,
  data        TIMESTAMP     NOT NULL
);

-- BLOCO 2: perfis ligados ao usuario (aluno e coordenador)


-- Tabela coordenador: perfil de coordenador ligado ao usuario
CREATE TABLE coordenador (
  id_usuario          INT           PRIMARY KEY,
  area                VARCHAR(100)  NOT NULL,
  telefone            VARCHAR(20),
  cargo               VARCHAR(100),
  data_admissao       DATE,
  cidade_nascimento   VARCHAR(100),
  estado_nascimento   VARCHAR(2),
  CONSTRAINT fk_coordenador_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE RESTRICT
);

-- Tabela mentor: perfil de mentor e origem
CREATE TABLE mentor (
  id_usuario      INT           PRIMARY KEY,
  tipo_vinculo    VARCHAR(50)   NOT NULL,
  disponibilidade VARCHAR(100)  NOT NULL,
  especialidade   TEXT,
  ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
  id_coordenador  INT           NOT NULL,
  CONSTRAINT fk_mentor_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
  CONSTRAINT fk_mentor_coordenador FOREIGN KEY (id_coordenador)
    REFERENCES coordenador (id_usuario) ON DELETE RESTRICT
);

-- Tabela aluno: perfil de aluno ligado ao usuario
-- O vinculo aluno-mentor é gerenciado pela tabela acompanha (N:N com programa).
CREATE TABLE aluno (
  id_usuario INT      PRIMARY KEY,
  ativo      BOOLEAN  NOT NULL DEFAULT TRUE,
  telefone            VARCHAR(20),
  data_nascimento     DATE,
  cidade_nascimento   VARCHAR(100),
  estado_nascimento   VARCHAR(2),
  programa_ingresso   VARCHAR(100),
  data_ingresso       DATE,
  escolaridade        VARCHAR(100),
  status_profissional VARCHAR(100),
  observacoes         TEXT,
  CONSTRAINT fk_aluno_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE RESTRICT
);



-- BLOCO 3: historico e anotacoes


-- Tabela historico_profissional: dados de carreira do aluno
CREATE TABLE historico_profissional (
  id_historico SERIAL        PRIMARY KEY,
  id_aluno     INT           NOT NULL,
  data_inicio  DATE          NOT NULL,
  data_fim     DATE,
  renda        NUMERIC(10, 2),
  cargo        VARCHAR(100),
  empresa      VARCHAR(150),
  CONSTRAINT fk_historico_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

-- Tabela anotacao_privada: registros de mentor sobre aluno
CREATE TABLE anotacao_privada (
  id_mentor      INT       NOT NULL,
  id_aluno       INT       NOT NULL,
  data_registro  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  conteudo_texto TEXT      NOT NULL,
  PRIMARY KEY (id_mentor, id_aluno, data_registro),
  CONSTRAINT fk_anotacao_mentor FOREIGN KEY (id_mentor)
    REFERENCES mentor (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_anotacao_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);


-- BLOCO 4: tabelas de relacao N:N e registros de jornada


-- Tabela gerencia: ligacao N:N entre coordenador e programa
CREATE TABLE gerencia (
  id_coordenador INT NOT NULL,
  id_programa    INT NOT NULL,
  PRIMARY KEY (id_coordenador, id_programa),
  CONSTRAINT fk_gerencia_coordenador FOREIGN KEY (id_coordenador)
    REFERENCES coordenador (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_gerencia_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE
);

-- Tabela matricula: ligacao N:N entre programa e aluno
CREATE TABLE matricula (
  id_programa      INT  NOT NULL,
  id_aluno         INT  NOT NULL,
  status_conclusao INT  NOT NULL,
  data_ingresso    DATE NOT NULL,
  PRIMARY KEY (id_programa, id_aluno),
  CONSTRAINT fk_matricula_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE,
  CONSTRAINT fk_matricula_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

-- Tabela realiza_entrega: entregas de atividades por aluno
CREATE TABLE realiza_entrega (
  id_atividade INT  NOT NULL,
  id_aluno     INT  NOT NULL,
  data_entrega DATE NOT NULL,
  PRIMARY KEY (id_atividade, id_aluno),
  CONSTRAINT fk_realiza_entrega_atividade FOREIGN KEY (id_atividade)
    REFERENCES atividade (id_atividade) ON DELETE CASCADE,
  CONSTRAINT fk_realiza_entrega_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

-- Tabela participa_evento: presenca em eventos
CREATE TABLE participa_evento (
  id_evento INT     NOT NULL,
  id_aluno  INT     NOT NULL,
  presenca  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_evento, id_aluno),
  CONSTRAINT fk_participa_evento FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_participa_evento_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

-- Tabela participa_mentoria: presenca em mentorias
CREATE TABLE participa_mentoria (
  id_mentoria INT NOT NULL,
  id_aluno    INT NOT NULL,
  PRIMARY KEY (id_mentoria, id_aluno),
  CONSTRAINT fk_participa_mentoria FOREIGN KEY (id_mentoria)
    REFERENCES mentoria (id_mentoria) ON DELETE CASCADE,
  CONSTRAINT fk_participa_mentoria_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

-- Tabela acompanha: mentor acompanha aluno
CREATE TABLE acompanha (
  id_mentor INT NOT NULL,
  id_aluno  INT NOT NULL,
  id_programa INT NOT NULL,
  PRIMARY KEY (id_mentor, id_aluno, id_programa),
  CONSTRAINT fk_acompanha_mentor FOREIGN KEY (id_mentor)
    REFERENCES mentor (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_acompanha_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_acompanha_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE
);

-- Tabela realiza: mentor realiza mentoria
CREATE TABLE realiza (
  id_mentor   INT NOT NULL,
  id_mentoria INT NOT NULL,
  PRIMARY KEY (id_mentor, id_mentoria),
  CONSTRAINT fk_realiza_mentor FOREIGN KEY (id_mentor)
    REFERENCES mentor (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_realiza_mentoria FOREIGN KEY (id_mentoria)
    REFERENCES mentoria (id_mentoria) ON DELETE CASCADE
);

-- Tabela avaliacao: nota de um aluno em um indicador
CREATE TABLE avaliacao (
  id_avaliacao   SERIAL    PRIMARY KEY,
  nota           INT       NOT NULL,
  data_avaliacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_indicador   INT       NOT NULL,
  id_aluno       INT       NOT NULL,
  CONSTRAINT fk_avaliacao_indicador FOREIGN KEY (id_indicador)
    REFERENCES indicador (id_indicador) ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE,
  CONSTRAINT chk_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS aula (
  id_aula     SERIAL        PRIMARY KEY,
  id_programa INT           NOT NULL,
  numero      INT           NOT NULL,
  titulo      VARCHAR(200),
  data_aula   DATE,
  CONSTRAINT fk_aula_programa
    FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa)
    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_aula_id_programa ON aula (id_programa);


-- INDICES: aceleram consultas em campos usados nos filtros


CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_cpf   ON usuario (cpf);

CREATE INDEX idx_aluno_ativo     ON aluno (ativo);

CREATE INDEX idx_matricula_id_aluno          ON matricula (id_aluno);
CREATE INDEX idx_participa_evento_id_aluno   ON participa_evento (id_aluno);
CREATE INDEX idx_participa_mentoria_id_aluno ON participa_mentoria (id_aluno);
CREATE INDEX idx_realiza_entrega_id_aluno    ON realiza_entrega (id_aluno);
CREATE INDEX idx_acompanha_id_aluno          ON acompanha (id_aluno);
CREATE INDEX idx_acompanha_id_programa       ON acompanha (id_programa);
CREATE INDEX idx_realiza_id_mentor           ON realiza (id_mentor);
CREATE INDEX idx_avaliacao_id_aluno          ON avaliacao (id_aluno);
CREATE INDEX idx_historico_id_aluno          ON historico_profissional (id_aluno);
CREATE INDEX idx_anotacao_id_aluno           ON anotacao_privada (id_aluno);

-- ============================================================
-- MIGRATIONS INCREMENTAIS
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- MIGRATION 002: colunas de perfil que podem estar ausentes em bancos antigos
-- (foto_url no usuario, campos de perfil no aluno)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE aluno ADD COLUMN IF NOT EXISTS telefone            VARCHAR(20);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS data_nascimento     DATE;
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS cidade_nascimento   VARCHAR(100);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS estado_nascimento   VARCHAR(2);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS programa_ingresso   VARCHAR(100);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS data_ingresso       DATE;
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS escolaridade        VARCHAR(100);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS status_profissional VARCHAR(100);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS observacoes         TEXT;

-- MIGRATION 003: campos do Portal do Ex-Aluno (RF005)
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS empresa_atual            VARCHAR(150);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS cargo_atual              VARCHAR(100);
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS area_interesse           TEXT;
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS disponibilidade_mentoria BOOLEAN;
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS data_formatura           DATE;
ALTER TABLE aluno
ADD COLUMN IF NOT EXISTS estagio_jornada VARCHAR(20)
    DEFAULT 'conectado'
    CHECK (estagio_jornada IN ('conectado', 'capacitado', 'transformado', 'mentor'));
ALTER TABLE atividade
  ADD COLUMN IF NOT EXISTS nome         VARCHAR(200),
  ADD COLUMN IF NOT EXISTS descricao    TEXT,
  ADD COLUMN IF NOT EXISTS data_entrega DATE;

-- Tabela oportunidade: vagas, eventos e bolsas para ex-alunos
CREATE TABLE oportunidade (
  id_oportunidade SERIAL       PRIMARY KEY,
  titulo          VARCHAR(200) NOT NULL,
  empresa         VARCHAR(150) NOT NULL,
  tipo            VARCHAR(50)  NOT NULL,
  modalidade      VARCHAR(50)  NOT NULL,
  cidade          VARCHAR(100),
  descricao       TEXT,
  nivel           VARCHAR(50),
  prazo           DATE         NOT NULL,
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMP             DEFAULT NOW(),
  CONSTRAINT chk_oportunidade_tipo CHECK (
    tipo IN ('Vaga', 'Evento', 'Estágio', 'Bolsa de Estudo')
  )
);

CREATE INDEX idx_oportunidade_ativo ON oportunidade (ativo);
CREATE INDEX idx_oportunidade_tipo  ON oportunidade (tipo);

-- Tabela presenca: registro de frequencia de aluno por aula
-- id_aula refere-se ao identificador da aula (hardcoded no frontend ate existir tabela de aulas)
CREATE TABLE presenca (
  id_presenca   SERIAL       PRIMARY KEY,
  id_aluno      INT          NOT NULL,
  id_aula       INT          NOT NULL,
  status        VARCHAR(10)  NOT NULL,
  registrado_em TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_presenca_aluno_aula  UNIQUE (id_aluno, id_aula),
  CONSTRAINT chk_presenca_status     CHECK  (status IN ('presente', 'ausente')),
  CONSTRAINT fk_presenca_aluno       FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

CREATE INDEX idx_presenca_id_aluno ON presenca (id_aluno);

-- MIGRATION 004: corrige schema da tabela atividade (substitui coluna status
-- por nome, descricao e data_entrega, refletindo o estado real do banco)
ALTER TABLE atividade DROP COLUMN IF EXISTS status;
ALTER TABLE atividade ADD COLUMN IF NOT EXISTS nome          VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE atividade ADD COLUMN IF NOT EXISTS descricao     TEXT;
ALTER TABLE atividade ADD COLUMN IF NOT EXISTS data_entrega  DATE NOT NULL DEFAULT CURRENT_DATE;

-- MIGRATION 005: colunas de perfil do coordenador usadas no frontend
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS telefone            VARCHAR(20);
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS cargo               VARCHAR(100);
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS data_admissao       DATE;
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS cidade_nascimento   VARCHAR(100);
ALTER TABLE coordenador ADD COLUMN IF NOT EXISTS estado_nascimento   VARCHAR(2);

-- MIGRATION 006: conquistas cadastradas manualmente pelo coordenador (certificados
-- com arquivo anexado), somadas às conquistas derivadas de evento/matricula/historico
-- em findConquistasById. arquivo_url guarda o PDF/imagem em base64 (mesmo padrão de
-- usuario.foto_url), já que o projeto não usa um serviço de storage externo.
CREATE TABLE IF NOT EXISTS conquista_manual (
  id_conquista SERIAL        PRIMARY KEY,
  id_aluno     INT           NOT NULL,
  titulo       VARCHAR(200)  NOT NULL,
  categoria    VARCHAR(50)   NOT NULL DEFAULT 'Certificado',
  data         DATE          NOT NULL,
  descricao    TEXT,
  arquivo_url  TEXT,
  criado_em    TIMESTAMP              DEFAULT NOW(),
  CONSTRAINT fk_conquista_manual_aluno FOREIGN KEY (id_aluno)
    REFERENCES aluno (id_usuario) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conquista_manual_id_aluno ON conquista_manual (id_aluno);

-- MIGRATION 007: hierarquia Programa -> Curso -> Aula -> Presença e tipo de programa.
-- Idempotente: pode ser executada novamente sem erro mesmo se já aplicada manualmente.
ALTER TABLE programa ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'Pulse Mais';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_programa_tipo') THEN
    ALTER TABLE programa ADD CONSTRAINT chk_programa_tipo CHECK (tipo IN ('Pulse Mais', 'Mentoria'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS curso (
  id_curso    SERIAL       PRIMARY KEY,
  id_programa INT          NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  ordem       INT          NOT NULL DEFAULT 1,
  CONSTRAINT fk_curso_programa FOREIGN KEY (id_programa)
    REFERENCES programa (id_programa) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_curso_id_programa ON curso (id_programa);

ALTER TABLE aula ADD COLUMN IF NOT EXISTS id_curso INT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aula_curso') THEN
    ALTER TABLE aula ADD CONSTRAINT fk_aula_curso FOREIGN KEY (id_curso)
      REFERENCES curso (id_curso) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_aula_id_curso ON aula (id_curso);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presenca_aula') THEN
    ALTER TABLE presenca ADD CONSTRAINT fk_presenca_aula FOREIGN KEY (id_aula)
      REFERENCES aula (id_aula) ON DELETE CASCADE;
  END IF;
END $$;

-- MIGRATION 008: campos de relatório de mentoria usados pelas telas do mentor
-- (Agenda de Mentorias envia `observacoes`; Dados do Aluno envia `relatorio` e
-- `encaminhamentos`). Sem estas colunas o POST /mentorias falha no PostgREST.
ALTER TABLE mentoria ADD COLUMN IF NOT EXISTS relatorio       TEXT;
ALTER TABLE mentoria ADD COLUMN IF NOT EXISTS encaminhamentos TEXT;
ALTER TABLE mentoria ADD COLUMN IF NOT EXISTS observacoes     TEXT;

-- MIGRATION 009: campo para o mentor marcar se o encontro de mentoria aconteceu
ALTER TABLE mentoria ADD COLUMN IF NOT EXISTS realizada BOOLEAN DEFAULT NULL;