// src/db/migrate.ts
// DDL sincronizado com o schema real do Supabase (introspectado via information_schema).

import { pool } from './pool';

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── usuario ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id        SERIAL PRIMARY KEY,
        id_jovem  INTEGER,
        nome      VARCHAR(100) NOT NULL,
        email     VARCHAR(100) NOT NULL UNIQUE,
        perfil    VARCHAR(12)  NOT NULL CHECK (
                    perfil IN ('Gestao','Coordenacao','Psicologo','Mentor','Aluno')
                  ),
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // ── jovem ──────────────────────────────────────────────────────────────────
    // Nullability espelha o banco real:
    //   cpf        → nullable  (banco criado sem NOT NULL)
    //   email      → NOT NULL  (banco criado com NOT NULL)
    //   categoria_atual → NOT NULL
    //   status_global   → nullable, sem default
    await client.query(`
      CREATE TABLE IF NOT EXISTS jovem (
        id              SERIAL PRIMARY KEY,
        nome            VARCHAR(100) NOT NULL,
        email           VARCHAR(100) NOT NULL UNIQUE,
        telefone        VARCHAR(20),
        cpf             VARCHAR(14) UNIQUE,
        data_nascimento DATE,
        endereco        VARCHAR(200),
        genero          VARCHAR(30),
        renda_inicial   DECIMAL(10,2),
        categoria_atual VARCHAR(12) NOT NULL CHECK (
                          categoria_atual IN ('Conectado','Capacitado','Transformado')
                        ),
        status_global   VARCHAR(20) CHECK (
                          status_global IN ('Ativo','Formado','Evadido','Inativo')
                        ),
        criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em   TIMESTAMP
      );
    `);

    // FK diferida: usuario.id_jovem → jovem.id (adicionada após criação das duas tabelas)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuario_jovem'
        ) THEN
          ALTER TABLE usuario
            ADD CONSTRAINT fk_usuario_jovem
            FOREIGN KEY (id_jovem) REFERENCES jovem(id)
            ON DELETE SET NULL
            NOT VALID;
        END IF;
      END $$;
    `);

    // ── categoria ──────────────────────────────────────────────────────────────
    // RN07: registra id_usuario responsável e categoria_anterior para auditoria.
    await client.query(`
      CREATE TABLE IF NOT EXISTS categoria (
        id                  SERIAL PRIMARY KEY,
        id_jovem            INTEGER     NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        id_usuario          INTEGER     REFERENCES usuario(id) ON DELETE SET NULL,
        categoria_adquirida VARCHAR(20) NOT NULL CHECK (
                              categoria_adquirida IN ('Conectado','Capacitado','Transformado')
                            ),
        categoria_anterior  VARCHAR(20) CHECK (
                              categoria_anterior IN ('Conectado','Capacitado','Transformado')
                            ),
        data_inclusao       TIMESTAMP   NOT NULL DEFAULT NOW()
      );
    `);

    // ── programa ───────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS programa (
        id          SERIAL PRIMARY KEY,
        nome        VARCHAR(100) NOT NULL,
        descricao   TEXT,
        data_inicio DATE,
        data_fim    DATE
      );
    `);

    // ── inscricao_programa ─────────────────────────────────────────────────────
    // data_matricula e data_status são DATE nullable no banco real.
    await client.query(`
      CREATE TABLE IF NOT EXISTS inscricao_programa (
        id               SERIAL PRIMARY KEY,
        id_jovem         INTEGER NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        id_programa      INTEGER NOT NULL REFERENCES programa(id) ON DELETE CASCADE,
        status_conclusao VARCHAR(12) NOT NULL CHECK (
                           status_conclusao IN ('Em andamento','Concluido','Evadido')
                         ),
        data_matricula   DATE,
        data_status      DATE
      );
    `);

    // ── aula ───────────────────────────────────────────────────────────────────
    // data é TIMESTAMP no banco real (não DATE).
    await client.query(`
      CREATE TABLE IF NOT EXISTS aula (
        id          SERIAL PRIMARY KEY,
        id_programa INTEGER NOT NULL REFERENCES programa(id) ON DELETE CASCADE,
        nome        VARCHAR(100) NOT NULL,
        data        TIMESTAMP NOT NULL
      );
    `);

    // ── frequencia_aula ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS frequencia_aula (
        id       SERIAL PRIMARY KEY,
        id_jovem INTEGER      NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        id_aula  INTEGER      REFERENCES aula(id) ON DELETE SET NULL,
        aula     VARCHAR(100) NOT NULL,
        data     DATE,
        presente BOOLEAN      NOT NULL
      );
    `);

    // ── evento ─────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS evento (
        id        SERIAL PRIMARY KEY,
        nome      VARCHAR(100) NOT NULL,
        data      TIMESTAMP NOT NULL,
        descricao TEXT
      );
    `);

    // ── participacao_evento ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS participacao_evento (
        id        SERIAL PRIMARY KEY,
        id_jovem  INTEGER      NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        id_evento INTEGER      REFERENCES evento(id) ON DELETE SET NULL,
        evento    VARCHAR(100) NOT NULL,
        data      DATE,
        presente  BOOLEAN      NOT NULL
      );
    `);

    // ── empregabilidade ────────────────────────────────────────────────────────
    // Banco real:
    //   data_registro → DATE NOT NULL (não TIMESTAMP)
    //   encerrado     → SMALLINT NOT NULL DEFAULT 0
    //   data_final    → DATE nullable (ausente no migrate antigo)
    await client.query(`
      CREATE TABLE IF NOT EXISTS empregabilidade (
        id            SERIAL PRIMARY KEY,
        id_jovem      INTEGER     NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        situacao      VARCHAR(20) NOT NULL CHECK (
                        situacao IN ('Empregado','Procurando')
                      ),
        vinculo       VARCHAR(20) CHECK (
                        vinculo IN ('Jovem Aprendiz','Estagio','Efetivado')
                      ),
        empresa       VARCHAR(100),
        area_atuacao  VARCHAR(100),
        renda_atual   DECIMAL(10,2),
        data_registro DATE        NOT NULL,
        encerrado     SMALLINT    NOT NULL DEFAULT 0 CHECK (encerrado IN (0, 1)),
        data_final    DATE
      );
    `);

    // ── ensino_superior ────────────────────────────────────────────────────────
    // Banco real:
    //   ingressou     → SMALLINT NOT NULL (sem default)
    //   situacao      → NOT NULL
    //   periodo       → não existe no banco (removida)
    //   data_registro → DATE NOT NULL (não TIMESTAMP)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ensino_superior (
        id            SERIAL PRIMARY KEY,
        id_jovem      INTEGER     NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        ingressou     SMALLINT    NOT NULL CHECK (ingressou IN (0, 1)),
        situacao      VARCHAR(20) NOT NULL CHECK (
                        situacao IN ('Concluido','Cursando','Não possui')
                      ),
        instituicao   VARCHAR(100),
        data_registro DATE        NOT NULL
      );
    `);

    // ── vinculo_mentoria ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS vinculo_mentoria (
        id             SERIAL PRIMARY KEY,
        id_mentor      INTEGER     NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        id_jovem       INTEGER     NOT NULL REFERENCES jovem(id)   ON DELETE CASCADE,
        status_vinculo VARCHAR(20) NOT NULL DEFAULT 'Ativo',
        data_inicio    DATE        NOT NULL,
        data_fim       DATE
      );
    `);

    // ── sessao_mentoria ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessao_mentoria (
        id        SERIAL PRIMARY KEY,
        id_jovem  INTEGER  NOT NULL REFERENCES jovem(id)   ON DELETE CASCADE,
        id_mentor INTEGER  NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        data      DATE,
        presente  BOOLEAN  NOT NULL
      );
    `);

    // ── registro_acompanhamento ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS registro_acompanhamento (
        id            SERIAL PRIMARY KEY,
        id_jovem      INTEGER     NOT NULL REFERENCES jovem(id)   ON DELETE CASCADE,
        id_autor      INTEGER     NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        tipo_registro VARCHAR(30) NOT NULL CHECK (
                        tipo_registro IN (
                          'Acompanhamento_Psicologico',
                          'Mentoria',
                          'Atendimento_Equipe'
                        )
                      ),
        visibilidade  VARCHAR(25) NOT NULL DEFAULT 'Publico_Equipe' CHECK (
                        visibilidade IN ('Publico_Equipe','Restrito_Psicologia')
                      ),
        conteudo      TEXT        NOT NULL,
        data_registro TIMESTAMP   NOT NULL DEFAULT NOW()
      );
    `);

    // ── computador_doado ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS computador_doado (
        id             SERIAL PRIMARY KEY,
        id_jovem       INTEGER      NOT NULL REFERENCES jovem(id) ON DELETE CASCADE,
        data_doacao    DATE         NOT NULL,
        data_devolucao DATE,
        modelo         VARCHAR(100)
      );
    `);

    // ── historico_acoes ────────────────────────────────────────────────────────
    // Banco real: id_usuario NOT NULL (sem ON DELETE SET NULL).
    await client.query(`
      CREATE TABLE IF NOT EXISTS historico_acoes (
        id               SERIAL PRIMARY KEY,
        id_usuario       INTEGER      NOT NULL REFERENCES usuario(id),
        id_jovem_afetado INTEGER      REFERENCES jovem(id) ON DELETE SET NULL,
        acao             VARCHAR(100) NOT NULL,
        tabela_afetada   VARCHAR(20),
        valor_anterior   TEXT,
        data_hora        TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);

    // ── alterações incrementais ─────────────────────────────────────────────────
    // Adiciona colunas de auditoria em categoria (se ainda não existirem).
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'categoria' AND column_name = 'id_usuario'
        ) THEN
          ALTER TABLE categoria ADD COLUMN id_usuario INTEGER REFERENCES usuario(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'categoria' AND column_name = 'categoria_anterior'
        ) THEN
          ALTER TABLE categoria ADD COLUMN categoria_anterior VARCHAR(20)
            CHECK (categoria_anterior IN ('Conectado','Capacitado','Transformado'));
        END IF;
      END $$;
    `);

    // Converte presente de SMALLINT → BOOLEAN nas tabelas que ainda tiverem o tipo antigo.
    // Aplicado via Supabase MCP em 2026-06-10; mantido aqui para ambientes recriados do zero.
    for (const table of ['frequencia_aula', 'participacao_evento', 'sessao_mentoria']) {
      await client.query(`
        DO $$ DECLARE cname text;
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = '${table}'
               AND column_name = 'presente' AND data_type = 'smallint'
          ) THEN
            SELECT conname INTO cname FROM pg_constraint
             WHERE conrelid = ('public.${table}')::regclass
               AND conname LIKE '%presente%' AND contype = 'c'
             LIMIT 1;
            IF cname IS NOT NULL THEN
              EXECUTE format('ALTER TABLE public.${table} DROP CONSTRAINT %I', cname);
            END IF;
            ALTER TABLE public.${table} ALTER COLUMN presente TYPE BOOLEAN USING (presente <> 0);
          END IF;
        END $$;
      `);
    }

    // Adiciona coluna modelo em computador_doado (se ainda não existir).
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'computador_doado' AND column_name = 'modelo'
        ) THEN
          ALTER TABLE computador_doado ADD COLUMN modelo VARCHAR(100);
        END IF;
      END $$;
    `);

    // Colunas de perfil profissional em usuario (Mentor / Psicólogo).
    for (const [col, tipo] of [
      ['telefone',           'VARCHAR(20)'],
      ['cidade',             'VARCHAR(100)'],
      ['area_atuacao',       'VARCHAR(200)'],
      ['disponibilidade',    'VARCHAR(200)'],
      ['biografia',          'TEXT'],
      ['crp',                'VARCHAR(20)'],
      ['especializacao',     'VARCHAR(200)'],
      ['abordagem',          'VARCHAR(200)'],
      ['horario_atendimento','VARCHAR(200)'],
    ] as const) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
             WHERE table_name = 'usuario' AND column_name = '${col}'
          ) THEN
            ALTER TABLE usuario ADD COLUMN ${col} ${tipo};
          END IF;
        END $$;
      `);
    }

    // Colunas de avaliação e duração em sessao_mentoria.
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'sessao_mentoria' AND column_name = 'avaliacao'
        ) THEN
          ALTER TABLE sessao_mentoria ADD COLUMN avaliacao NUMERIC(3,1);
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'sessao_mentoria' AND column_name = 'duracao_minutos'
        ) THEN
          ALTER TABLE sessao_mentoria ADD COLUMN duracao_minutos INTEGER DEFAULT 60;
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Migrate concluído com sucesso.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no migrate, rollback executado:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();