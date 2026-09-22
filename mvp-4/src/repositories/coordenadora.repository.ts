import pool from '../database/connection';
import { AlunoCoordenadora, AtualizarFrequencia, ComunicadoCoordenadora, Coordenadora, RegistrarEvento, RegistrarFrequencia, RegistrarObservacao, Relatorio } from '../database/models/coordenadora.model';
import { preencherCategoriaAluno } from '../utils/categoria-aluno';

interface FiltrosAlunoCoordenadora {
  status?: string;
  id_turma?: number;
  idade_min?: number;
  idade_max?: number;
  empregabilidade?: string;
  localizacao?: string;
  eventos_min?: number;
  eventos_max?: number;
  genero?: string;
}

export class CoordenadoraRepository {
  async buscarPorRm(rm: number): Promise<Coordenadora | null> {
    const result = await pool.query<Coordenadora>(
      `SELECT
        rm,
        nome,
        NULL::text AS cargo,
        NULL::text AS setor,
        email
       FROM coordenador
       WHERE rm = $1`,
      [rm],
    );

    return result.rows[0] ?? null;
  }

  async listarAlunos(rm: number): Promise<AlunoCoordenadora[]> {
    const result = await pool.query<AlunoCoordenadora>(
      `SELECT
        aluno.ra,
        aluno.nome,
        aluno.status,
        aluno.categoria,
        aluno.nivel_formacao,
        aluno.id_turma,
        COALESCE(BOOL_OR(frequenta.frequencia), false) AS frequencia
       FROM aluno
       LEFT JOIN frequenta ON frequenta.id_aluno = aluno.ra
       WHERE EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $1
       )
       GROUP BY
        aluno.ra,
        aluno.nome,
        aluno.status,
        aluno.categoria,
        aluno.nivel_formacao,
        aluno.id_turma
       ORDER BY aluno.ra`,
      [rm],
    );

    return result.rows.map(preencherCategoriaAluno);
  }

  async listarAlunosComFiltros(
    rm: number,
    filtros: FiltrosAlunoCoordenadora,
  ): Promise<AlunoCoordenadora[]> {
    const condicoes: string[] = [
      `EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $1
      )`,
    ];
    const params: unknown[] = [rm];
    let indice = 2;

    if (filtros.status !== undefined) {
      condicoes.push(`(
        LOWER(aluno.status::text) = LOWER($${indice}::text)
        OR (
          LOWER($${indice}::text) IN ('ativo', 'ativa')
          AND LOWER(aluno.status::text) IN ('true', 't', '1')
        )
        OR (
          LOWER($${indice}::text) IN ('inativo', 'inativa')
          AND LOWER(aluno.status::text) IN ('false', 'f', '0')
        )
      )`);
      params.push(filtros.status);
      indice += 1;
    }

    if (filtros.id_turma !== undefined) {
      condicoes.push(`aluno.id_turma = $${indice}`);
      params.push(filtros.id_turma);
      indice += 1;
    }

    if (filtros.idade_min !== undefined) {
      condicoes.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, aluno.data_nasc)) >= $${indice}`);
      params.push(filtros.idade_min);
      indice += 1;
    }

    if (filtros.idade_max !== undefined) {
      condicoes.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, aluno.data_nasc)) <= $${indice}`);
      params.push(filtros.idade_max);
      indice += 1;
    }

    if (filtros.genero !== undefined) {
      condicoes.push(`LOWER(aluno.genero) = LOWER($${indice})`);
      params.push(filtros.genero);
      indice += 1;
    }

    if (filtros.empregabilidade !== undefined) {
      const empregabilidade = filtros.empregabilidade.toLowerCase();

      if (['empregado', 'empregada', 'ativo', 'ativa'].includes(empregabilidade)) {
        condicoes.push(`EXISTS (
          SELECT 1
          FROM empregabilidade
          WHERE empregabilidade.id_aluno = aluno.ra
          AND empregabilidade.data_encerramento IS NULL
        )`);
      } else if (
        ['desempregado', 'desempregada', 'sem emprego', 'sem emprego ativo'].includes(empregabilidade)
      ) {
        condicoes.push(`NOT EXISTS (
          SELECT 1
          FROM empregabilidade
          WHERE empregabilidade.id_aluno = aluno.ra
          AND empregabilidade.data_encerramento IS NULL
        )`);
      }
    }

    if (filtros.eventos_min !== undefined) {
      condicoes.push(`(
        SELECT COUNT(*)::int
        FROM participa
        WHERE participa.id_aluno = aluno.ra
      ) >= $${indice}`);
      params.push(filtros.eventos_min);
      indice += 1;
    }

    if (filtros.eventos_max !== undefined) {
      condicoes.push(`(
        SELECT COUNT(*)::int
        FROM participa
        WHERE participa.id_aluno = aluno.ra
      ) <= $${indice}`);
      params.push(filtros.eventos_max);
      indice += 1;
    }

    if (filtros.localizacao !== undefined) {
      const colunasLocalizacao = await this.listarColunasAluno(['endereco', 'cep']);

      if (colunasLocalizacao.length === 0) {
        condicoes.push('FALSE');
      } else {
        const condicoesLocalizacao = colunasLocalizacao.map(
          coluna => `aluno.${coluna} ILIKE $${indice}`,
        );
        condicoes.push(`(${condicoesLocalizacao.join(' OR ')})`);
        params.push(`%${filtros.localizacao}%`);
        indice += 1;
      }
    }

    const result = await pool.query<AlunoCoordenadora>(
      `SELECT
        aluno.ra,
        aluno.nome,
        aluno.status,
        aluno.categoria,
        aluno.nivel_formacao,
        aluno.id_turma,
        COALESCE(BOOL_OR(frequenta.frequencia), false) AS frequencia
       FROM aluno
       LEFT JOIN frequenta ON frequenta.id_aluno = aluno.ra
       WHERE ${condicoes.join(' AND ')}
       GROUP BY
        aluno.ra,
        aluno.nome,
        aluno.status,
        aluno.categoria,
        aluno.nivel_formacao,
        aluno.id_turma
       ORDER BY aluno.ra`,
      params,
    );

    return result.rows.map(preencherCategoriaAluno);
  }

  private async listarColunasAluno(colunas: string[]): Promise<string[]> {
    const result = await pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND table_name = 'aluno'
       AND column_name = ANY($1::text[])`,
      [colunas],
    );

    return result.rows.map(row => row.column_name);
  }

  async cadastrarAluno(dados: {
    nome: string;
    cpf: string;
    email_primario: string;
    tel_primario?: string;
    genero?: string;
    data_nasc?: string;
    data_ingresso?: string;
    categoria?: string;
  }): Promise<number> {
    // Verifica conflitos por CPF ou e-mail
    const conflito = await pool.query(
      `SELECT cpf, email_primario FROM aluno WHERE cpf = $1 OR email_primario = $2`,
      [dados.cpf, dados.email_primario],
    );

    if (conflito.rows.length > 0) {
      const err: any = new Error('CPF ou e-mail já cadastrado');
      err.statusCode = 409;
      throw err;
    }

    const result = await pool.query(
      `INSERT INTO aluno (
        nome,
        cpf,
        email_primario,
        tel_primario,
        genero,
        data_nasc,
        data_ingresso,
        categoria,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ra`,
      [
        dados.nome,
        dados.cpf,
        dados.email_primario,
        dados.tel_primario ?? null,
        dados.genero ?? null,
        dados.data_nasc ?? null,
        dados.data_ingresso ?? null,
        dados.categoria ?? null,
        true,
      ],
    );

    return result.rows[0].ra;
  }

  async filtrarAlunos(
    rm: number,
    filtros: FiltrosAlunoCoordenadora,
  ): Promise<AlunoCoordenadora[]> {
    return this.listarAlunosComFiltros(rm, filtros);
  }

  async registrarFrequencia(
    rm: number,
    ra: number,
    dados: RegistrarFrequencia,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO frequenta (
        id_aluno,
        id_aula,
        data,
        frequencia
      ) VALUES ($1, $2, $3, $4)`,
      [
        ra,
        dados.id_aula,
        dados.data,
        dados.frequencia,
      ],
    );
  }

  async atualizarFrequencia(
    rm: number,
    ra: number,
    idAula: number,
    dados: AtualizarFrequencia,
  ): Promise<boolean> {
    const result = await pool.query(
      `UPDATE frequenta
       SET frequencia = $1
       WHERE id_aluno = $2
       AND id_aula = $3
       AND EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $4
       )`,
      [
        dados.frequencia,
        ra,
        idAula,
        rm,
      ],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async registrarObservacao(
    rm: number,
    ra: number,
    dados: RegistrarObservacao,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO relatorio (
      id_aluno,
      info_simplificada,
      observacoes,
      data,
      id_psicologo
    )
    SELECT $1, $2, COALESCE($3, ''), $4, NULL
    WHERE EXISTS (
      SELECT 1
      FROM coordenador
      WHERE coordenador.rm = $5
    )`,
      [
        ra,
        dados.info_simplificada,
        dados.observacoes,
        dados.data,
        rm,
      ],
    );
  }

  async registrarEvento(
    rm: number,
    dados: RegistrarEvento,
  ): Promise<void> {
    // A tabela comunicado mantem as colunas legadas data/tipo como NOT NULL
    // alem das colunas data_acontecer/categoria alinhadas ao diagrama. Preenche
    // ambas ($3 = data, $4 = categoria/tipo) para nao violar o NOT NULL legado.
    //
    // O conteudo enviado pelo front e HTML (pode conter imagens em base64) e
    // estoura a coluna descricao (VARCHAR 150). Guarda o HTML completo em
    // conteudo (TEXT) e um preview de texto puro (<= 150) em descricao.
    await pool.query(
      `INSERT INTO comunicado (
      tema,
      sede,
      data,
      tipo,
      data_acontecer,
      categoria,
      descricao,
      conteudo,
      enviado_por,
      data_envio
    )
    SELECT $1, $2, $3, $4, $3, $4,
      LEFT(regexp_replace($5, '<[^>]+>', '', 'g'), 150), $5, $6, NOW()
    WHERE EXISTS (
      SELECT 1
      FROM coordenador
      WHERE coordenador.rm = $6
    )`,
      [
        dados.tema,
        dados.sede,
        dados.data,
        dados.categoria,
        dados.descricao ?? null,
        rm,
      ],
    );
  }

  async listarComunicados(rm: number): Promise<ComunicadoCoordenadora[]> {
    const result = await pool.query<ComunicadoCoordenadora>(
      `SELECT
        id_comunicado,
        tema,
        sede,
        COALESCE(data_acontecer, data) AS data,
        COALESCE(categoria, tipo) AS tipo,
        COALESCE(NULLIF(conteudo, ''), descricao) AS descricao
       FROM comunicado
       WHERE EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $1
       )
       ORDER BY COALESCE(data_acontecer, data) DESC, id_comunicado DESC`,
      [rm],
    );

    return result.rows;
  }

  async excluirComunicado(rm: number, idComunicado: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM comunicado
       WHERE id_comunicado = $1
       AND EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $2
       )`,
      [idComunicado, rm],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async concluirModuloAluno(
    rm: number,
    ra: number,
    modulo: number,
    data: string,
  ): Promise<boolean> {
    const nomeCertificado = `Certificado de Conclusao - Modulo ${modulo}`;
    const padraoModuloAcentuado = `%Módulo ${modulo}%`;
    const padraoModuloSemAcento = `%Modulo ${modulo}%`;
    const result = await pool.query<{ autorizado: boolean }>(
      `WITH autorizado AS (
        SELECT EXISTS (
          SELECT 1
          FROM coordenador
          WHERE coordenador.rm = $1
        )
        AND EXISTS (
          SELECT 1
          FROM aluno
          WHERE aluno.ra = $2
        ) AS autorizado
       ),
       certificado_existente AS (
        SELECT 1
        FROM certificado
        WHERE id_aluno = $2
        AND (
          nome ILIKE $3
          OR nome ILIKE $4
        )
        LIMIT 1
       ),
       certificado_inserido AS (
        INSERT INTO certificado (id_certificado, nome, data, id_aluno)
        SELECT (
          SELECT COALESCE(MAX(id_certificado), 0) + 1
          FROM certificado
        ), $5, $6, $2
        FROM autorizado
        WHERE autorizado.autorizado
        AND NOT EXISTS (SELECT 1 FROM certificado_existente)
        RETURNING id_certificado
       )
       SELECT autorizado FROM autorizado`,
      [
        rm,
        ra,
        padraoModuloAcentuado,
        padraoModuloSemAcento,
        nomeCertificado,
        data,
      ],
    );

    return result.rows[0]?.autorizado ?? false;
  }

  async desfazerConclusaoModuloAluno(
    rm: number,
    ra: number,
    modulo: number,
  ): Promise<boolean> {
    const padraoModuloAcentuado = `%Módulo ${modulo}%`;
    const padraoModuloSemAcento = `%Modulo ${modulo}%`;
    const result = await pool.query(
      `DELETE FROM certificado
       WHERE id_aluno = $1
       AND (
        nome ILIKE $2
        OR nome ILIKE $3
       )
       AND EXISTS (
        SELECT 1
        FROM coordenador
        WHERE coordenador.rm = $4
       )`,
      [
        ra,
        padraoModuloAcentuado,
        padraoModuloSemAcento,
        rm,
      ],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async listarRelatorios(rm: number, ra: number): Promise<Relatorio[]> {
    const result = await pool.query<Relatorio>(
      `SELECT
        relatorio.id_relatorio,
        relatorio.info_simplificada,
        relatorio.observacoes,
        relatorio.data,
        relatorio.id_aluno,
        relatorio.id_psicologo
       FROM relatorio
       JOIN aluno ON aluno.ra = relatorio.id_aluno
       WHERE aluno.ra = $2
       AND EXISTS (
         SELECT 1
         FROM coordenador
         WHERE coordenador.rm = $1
       )
       ORDER BY relatorio.data DESC`,
      [rm, ra],
    );

    return result.rows;
  }
}
