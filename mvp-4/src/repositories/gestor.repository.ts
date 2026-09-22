import pool from '../database/connection';
import { preencherCategoriaAluno } from '../utils/categoria-aluno';
import {
  AlunoDestinatarioComunicado,
  AlunoConflitoImportacao,
  AlunoDetalhadoGestor,
  AlunoGestor,
  ArquivoImportacaoCsv,
  ComunicadoGestor,
  ComunicadoHistorico,
  FiltrosAluno,
  Gestor,
  RegistroHistoricoCsv,
  ResultadoImportacaoCsv,
} from '../database/models/gestor.model';

interface ErroCsv extends Error {
  statusCode?: number;
}

interface ErroBanco extends Error {
  code?: string;
}

export class GestorRepository {
  private static readonly EMAIL_NAO_COLETADO_PREFIXO = 'naocoletado';
  private static readonly CPF_NAO_COLETADO_PREFIXO = '##';
  private static readonly TELEFONE_NAO_COLETADO = '##';
  private static readonly DATA_NAO_COLETADA = '1900-01-01';
  private static readonly TEXTO_NAO_COLETADO = 'Não coletado';

  async buscarPorRm(rm: number): Promise<Gestor | null> {
    const result = await pool.query<Gestor>(
      'SELECT rm, nome, email FROM gestor WHERE rm = $1',
      [rm],
    );

    return result.rows[0] ?? null;
  }

  async listarAlunos(rm: number): Promise<AlunoGestor[]> {
    const result = await pool.query<AlunoGestor>(
      `SELECT
        a.ra,
        a.nome,
        a.status,
        a.categoria,
        a.nivel_formacao,
        a.id_turma AS "idTurma",
        EXISTS (
          SELECT 1
          FROM frequenta f
          WHERE f.id_aluno = a.ra
            AND f.frequencia = true
        ) AS frequencia,
        CASE
          WHEN e.id_emprego IS NULL THEN NULL
          ELSE json_build_object(
            'empresa', e.empresa,
            'cargo', e.cargo,
            'faixa_salarial', e.faixa_salarial
          )
        END AS empregabilidade
      FROM aluno a
      LEFT JOIN LATERAL (
        SELECT emprego.id_emprego, emprego.empresa, emprego.cargo, emprego.faixa_salarial
        FROM empregabilidade emprego
        WHERE emprego.id_aluno = a.ra
        ORDER BY emprego.data_inicio DESC, emprego.id_emprego DESC
        LIMIT 1
      ) e ON true
      WHERE EXISTS (
        SELECT 1
        FROM gestor g
        WHERE g.rm = $1
      )
      ORDER BY a.nome, a.ra`,
      [rm],
    );

    return result.rows.map(preencherCategoriaAluno);
  }

  async buscarAlunoPorRa(rm: number, ra: number): Promise<AlunoDetalhadoGestor | null> {
    const result = await pool.query<AlunoDetalhadoGestor>(
      `SELECT
        a.ra,
        a.nome,
        a.fotos AS foto,
        a.id_turma AS "idTurma",
        a.status,
        a.genero,
        a.email_primario,
        a.email_secundario,
        a.tel_primario,
        a.tel_secundario,
        a.cep,
        a.endereco,
        a.renda_familiar,
        CASE
          WHEN e.id_emprego IS NULL THEN NULL
          ELSE json_build_object(
            'empresa', e.empresa,
            'cargo', e.cargo,
            'faixa_salarial', e.faixa_salarial,
            'nivel_formacao', a.nivel_formacao
          )
        END AS empregabilidade
      FROM aluno a
      LEFT JOIN LATERAL (
        SELECT emprego.id_emprego, emprego.empresa, emprego.cargo, emprego.faixa_salarial
        FROM empregabilidade emprego
        WHERE emprego.id_aluno = a.ra
        ORDER BY emprego.data_inicio DESC, emprego.id_emprego DESC
        LIMIT 1
      ) e ON true
      WHERE a.ra = $2
        AND EXISTS (
          SELECT 1
          FROM gestor g
          WHERE g.rm = $1
        )`,
      [rm, ra],
    );

    const aluno = result.rows[0] ?? null;

    return aluno ? preencherCategoriaAluno(aluno) : null;
  }

  async filtrarAlunos(rm: number, filtros: FiltrosAluno): Promise<AlunoGestor[]> {
    const condicoes: string[] = ['EXISTS (SELECT 1 FROM gestor g WHERE g.rm = $1)'];
    const params: unknown[] = [rm];
    let indice = 2;

    if (filtros.idade_min !== undefined) {
      condicoes.push(`DATE_PART('year', AGE(a.data_nasc)) >= $${indice}`);
      params.push(filtros.idade_min);
      indice += 1;
    }

    if (filtros.idade_max !== undefined) {
      condicoes.push(`DATE_PART('year', AGE(a.data_nasc)) <= $${indice}`);
      params.push(filtros.idade_max);
      indice += 1;
    }

    if (filtros.id_turma !== undefined) {
      condicoes.push(`a.id_turma = $${indice}`);
      params.push(filtros.id_turma);
      indice += 1;
    }

    if (filtros.genero !== undefined) {
      condicoes.push(`a.genero ILIKE $${indice}`);
      params.push(`%${filtros.genero}%`);
      indice += 1;
    }

    if (filtros.eventos_min !== undefined) {
      condicoes.push(`(SELECT COUNT(*) FROM participa p WHERE p.id_aluno = a.ra) >= $${indice}`);
      params.push(filtros.eventos_min);
      indice += 1;
    }

    if (filtros.eventos_max !== undefined) {
      condicoes.push(`(SELECT COUNT(*) FROM participa p WHERE p.id_aluno = a.ra) <= $${indice}`);
      params.push(filtros.eventos_max);
      indice += 1;
    }

    const where = condicoes.join(' AND ');

    // Filtro de empregabilidade é aplicado dentro do LATERAL para não converter
    // o LEFT JOIN em INNER JOIN implícito (o que excluiria alunos sem emprego).
    const lateralFiltroEmpregabilidade =
      filtros.empregabilidade !== undefined
        ? `AND emprego.cargo ILIKE $${indice}`
        : '';

    if (filtros.empregabilidade !== undefined) {
      params.push(`%${filtros.empregabilidade}%`);
      indice += 1;
    }

    const result = await pool.query<AlunoGestor>(
      `SELECT
        a.ra,
        a.nome,
        a.status,
        a.categoria,
        a.nivel_formacao,
        a.id_turma AS "idTurma",
        EXISTS (
          SELECT 1
          FROM frequenta f
          WHERE f.id_aluno = a.ra
            AND f.frequencia = true
        ) AS frequencia,
        CASE
          WHEN e.id_emprego IS NULL THEN NULL
          ELSE json_build_object(
            'empresa', e.empresa,
            'cargo', e.cargo,
            'faixa_salarial', e.faixa_salarial
          )
        END AS empregabilidade
      FROM aluno a
      LEFT JOIN LATERAL (
        SELECT emprego.id_emprego, emprego.empresa, emprego.cargo, emprego.faixa_salarial
        FROM empregabilidade emprego
        WHERE emprego.id_aluno = a.ra
          ${lateralFiltroEmpregabilidade}
        ORDER BY emprego.data_inicio DESC, emprego.id_emprego DESC
        LIMIT 1
      ) e ON true
      WHERE ${where}
        ${filtros.empregabilidade !== undefined ? 'AND e.id_emprego IS NOT NULL' : ''}
      ORDER BY a.ra`,
      params,
    );

    return result.rows.map(preencherCategoriaAluno);
  }

  async listarComunicados(): Promise<ComunicadoHistorico[]> {
    const result = await pool.query<ComunicadoHistorico>(
      `SELECT
        id_comunicado,
        COALESCE(titulo, tema) AS titulo,
        COALESCE(conteudo, descricao, '') AS conteudo,
        COALESCE(NULLIF(tipo, ''), 'Informativo') AS tipo,
        COALESCE(NULLIF(destinatarios, ''), 'todos') AS destinatarios,
        total_destinatarios,
        COALESCE(data_envio, data::timestamptz) AS data_envio,
        NULLIF(sede, '') AS sede,
        data_acontecer
      FROM comunicado
      ORDER BY COALESCE(data_envio, data::timestamptz) DESC, id_comunicado DESC`,
    );

    return result.rows;
  }

  async enviarComunicado(comunicado: ComunicadoGestor): Promise<ComunicadoHistorico | null> {
    let filtroDestinatarios = '';

    if (comunicado.destinatarios === 'ativos') {
      filtroDestinatarios =
        "AND LOWER(BTRIM(a.status)) IN ('ativo', 'ativa', 'true') AND COALESCE(a.ex_aluno, false) = false";
    }

    if (comunicado.destinatarios === 'ex-alunos') {
      filtroDestinatarios = 'AND COALESCE(a.ex_aluno, false) = true';
    }

    const destinatarios = await pool.query<AlunoDestinatarioComunicado>(
      `SELECT
        a.ra,
        a.nome,
        a.email_primario
      FROM aluno a
      WHERE a.email_primario IS NOT NULL
        AND BTRIM(a.email_primario) <> ''
        ${filtroDestinatarios}
      ORDER BY a.nome ASC`,
    );

    const result = await pool.query<ComunicadoHistorico>(
      `INSERT INTO comunicado (
        sede,
        data,
        tipo,
        tema,
        descricao,
        enviado_por,
        titulo,
        conteudo,
        destinatarios,
        total_destinatarios,
        data_envio
      ) VALUES (
        '',
        CURRENT_DATE,
        $1,
        $2,
        $3::varchar,
        $4,
        $2,
        $3::text,
        $5,
        $6,
        NOW()
      )
      RETURNING
        id_comunicado,
        titulo,
        conteudo,
        tipo,
        destinatarios,
        total_destinatarios,
        data_envio,
        NULLIF(sede, '') AS sede,
        data_acontecer`,
      [
        comunicado.tipo || 'Informativo',
        comunicado.titulo,
        comunicado.conteudo,
        comunicado.enviado_por ?? null,
        comunicado.destinatarios,
        destinatarios.rows.length,
      ],
    );

    return result.rows?.[0] ?? null;
  }

  async excluirComunicado(idComunicado: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM comunicado WHERE id_comunicado = $1',
      [idComunicado],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async importarHistoricoCsv(arquivo: ArquivoImportacaoCsv): Promise<ResultadoImportacaoCsv> {
    const registros = this.extrairRegistrosCsv(arquivo);
    const resultado: ResultadoImportacaoCsv = {
      importados: 0,
      conflitos: [],
      ignorados: 0,
    };

    for (const registro of registros) {
      if (!registro) {
        resultado.ignorados += 1;
        continue;
      }

      try {
        const conflito = await pool.query<AlunoConflitoImportacao>(
          `SELECT ra, cpf, email_primario
           FROM aluno
           WHERE ($1::integer IS NOT NULL AND ra = $1)
              OR cpf = $2
              OR email_primario = $3`,
          [registro.ra, registro.cpf, registro.email_primario],
        );

        if (conflito.rows.length > 0) {
          resultado.conflitos.push({
            ra: registro.ra,
            motivo: this.identificarMotivoConflito(registro, conflito.rows),
          });
          continue;
        }

        await pool.query(
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            registro.nome,
            registro.cpf,
            registro.email_primario,
            registro.tel_primario,
            registro.genero,
            registro.data_nasc,
            registro.data_ingresso,
            registro.categoria,
            registro.status,
          ],
        );

        resultado.importados += 1;
      } catch (error) {
        const erroBanco = error as ErroBanco;

        if (erroBanco.code === '23505') {
          resultado.conflitos.push({
            ra: registro.ra,
            motivo: 'Registro duplicado durante a importacao',
          });
          continue;
        }

        if (this.ehErroBancoTratavel(erroBanco)) {
          resultado.ignorados += 1;
          continue;
        }

        throw error;
      }
    }

    return resultado;
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
    // Verifica conflitos por RA, CPF ou e-mail
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

  private extrairRegistrosCsv(arquivo: ArquivoImportacaoCsv): Array<RegistroHistoricoCsv | null> {
    const conteudo = arquivo.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const linhas = conteudo
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

    const cabecalhoEsperado = [
      'ra',
      'nome',
      'cpf',
      'email_primario',
      'tel_primario',
      'genero',
      'data_nasc',
      'data_ingresso',
      'categoria',
      'status',
    ];

    const cabecalho = this.parseLinhaCsv(linhas[0] ?? '').map((campo) => campo.trim());

    if (cabecalho.join(',') !== cabecalhoEsperado.join(',')) {
      const erro = new Error(
        'Estrutura do CSV nao corresponde ao modelo esperado.',
      ) as ErroCsv;
      erro.statusCode = 422;
      throw erro;
    }

    return linhas.slice(1).map((linha, indiceRegistro) => {
      const campos = this.parseLinhaCsv(linha).map((campo) => campo.trim());

      if (campos.length < cabecalhoEsperado.length) {
        return null;
      }

      const raTexto = campos[0];
      const ra =
        raTexto.length > 0 && Number.isInteger(Number(raTexto)) && Number(raTexto) > 0
          ? Number(raTexto)
          : null;
      const identificadorNaoColetado = indiceRegistro + 1;

      return {
        ra,
        nome: campos[1] || `naocoletado${identificadorNaoColetado}`,
        cpf: this.normalizarCpf(campos[2], identificadorNaoColetado),
        email_primario: this.normalizarEmail(campos[3], identificadorNaoColetado),
        tel_primario: this.normalizarTelefone(campos[4]),
        genero: this.normalizarTextoLivre(campos[5]),
        data_nasc: this.normalizarData(campos[6]),
        data_ingresso: this.normalizarData(campos[7]),
        categoria: this.normalizarTextoLivre(campos[8]),
        status: this.normalizarStatus(campos[9]),
      };
    });
  }

  private parseLinhaCsv(linha: string): string[] {
    const campos: string[] = [];
    let campoAtual = '';
    let dentroDeAspas = false;

    for (let indice = 0; indice < linha.length; indice += 1) {
      const caractere = linha[indice];
      const proximoCaractere = linha[indice + 1];

      if (caractere === '"' && dentroDeAspas && proximoCaractere === '"') {
        campoAtual += '"';
        indice += 1;
        continue;
      }

      if (caractere === '"') {
        dentroDeAspas = !dentroDeAspas;
        continue;
      }

      if (caractere === ',' && !dentroDeAspas) {
        campos.push(campoAtual);
        campoAtual = '';
        continue;
      }

      campoAtual += caractere;
    }

    campos.push(campoAtual);
    return campos;
  }

  private identificarMotivoConflito(
    registro: RegistroHistoricoCsv,
    conflitos: AlunoConflitoImportacao[],
  ): string {
    if (registro.ra !== null && conflitos.some((aluno) => aluno.ra === registro.ra)) {
      return 'RA ja cadastrado';
    }

    if (conflitos.some((aluno) => aluno.cpf === registro.cpf)) {
      return 'CPF ja cadastrado';
    }

    return 'E-mail ja cadastrado';
  }

  private normalizarEmail(email: string, identificador: number): string {
    if (email) {
      return email;
    }

    return `${GestorRepository.EMAIL_NAO_COLETADO_PREFIXO}${identificador}`;
  }

  private normalizarCpf(cpf: string, identificador: number): string {
    if (cpf) {
      return cpf;
    }

    return `${GestorRepository.CPF_NAO_COLETADO_PREFIXO}${identificador}`;
  }

  private normalizarTelefone(telefone: string): string {
    return telefone || GestorRepository.TELEFONE_NAO_COLETADO;
  }

  private normalizarTextoLivre(valor: string): string {
    return valor || GestorRepository.TEXTO_NAO_COLETADO;
  }

  private normalizarData(valor: string): string {
    const valorNormalizado = String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (!valorNormalizado || valorNormalizado.includes('coletado')) {
      return GestorRepository.DATA_NAO_COLETADA;
    }

    const dataIsoValida = /^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim());

    if (!dataIsoValida) {
      return GestorRepository.DATA_NAO_COLETADA;
    }

    return String(valor).trim();
  }

  private normalizarStatus(valor: string): boolean {
    return String(valor || '').toLowerCase() === 'true';
  }

  private ehErroBancoTratavel(erro: ErroBanco): boolean {
    return ['22007', '22P02', '23502', '23514'].includes(String(erro.code || ''));
  }
}
