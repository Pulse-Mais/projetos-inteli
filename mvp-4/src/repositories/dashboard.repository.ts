import pool from '../database/connection';
import {
  DashboardAlertasFiltros,
  DashboardEmpregabilidadeFiltros,
  DashboardFiltros,
  DashboardFrequenciaFiltros,
} from '../services/dashboard.service';

// amostra de dados par ao dashboard a aparecerem
export interface DashboardIndicadoresGerais {
  total_alunos_ativos: number;
  total_alunos_formados: number;
  total_jovens_empregados: number;
  total_alertas_evasao_ativos: number;
}

//frequência média por turma, assim como os alunos específicos em risco de evasão
export interface DashboardFrequenciaPorTurma {
  id_turma: number;
  nome_turma: string;
  media_presenca_percentual: number;
  alunos_em_risco: number;
}

//dados de empregabilidade dos alunos
export interface DashboardEmpregabilidade {
  total_empregados_ativos: number;
  taxa_retencao_3_meses: number;
  taxa_retencao_6_meses: number;
  taxa_retencao_12_meses: number;
}

//concluintes de curso
export interface DashboardConcluintesNoPeriodo {
  periodo_inicio: string | null;
  periodo_fim: string | null;
  total_concluintes: number;
}

// dados para o endpoint de frequência do dashboard
export interface DashboardDados {
  indicadores_gerais: DashboardIndicadoresGerais;
  frequencia_por_turma: DashboardFrequenciaPorTurma[];
  empregabilidade: DashboardEmpregabilidade;
  concluintes_no_periodo: DashboardConcluintesNoPeriodo;
}

export interface DashboardFrequenciaAluno {
  ra: number;
  nome: string;
  id_turma: number | null;
  nome_turma: string | null;
  total_aulas: number;
  presencas: number;
  percentual_presenca: number;
  alerta_evasao: boolean;
}

export interface DashboardFrequenciasDados {
  alunos: DashboardFrequenciaAluno[];
}

// dados para o endpoint do RF11 de alertas de evasão
export interface DashboardAlertaEvasao {
  id_alerta: number;
  ra: number;
  nome_aluno: string;
  id_turma: number | null;
  nome_turma: string | null;
  motivo: string;
  descricao: string | null;
  total_faltas_modulo: number;
  atividades_consecutivas_nao_entregues: number;
  status: string;
  data_alerta: string;
  data_resolucao?: string | null;
}

export interface DashboardAlertasEvasaoDados {
  alertas: DashboardAlertaEvasao[];
}

type TotalRow = {
  total: number;
};

//amostra para as taxas de retenção de alunos por períodos
type TaxasRetencaoRow = {
  taxa_retencao_3_meses: number;
  taxa_retencao_6_meses: number;
  taxa_retencao_12_meses: number;
};

export class DashboardRepository {
  async turmaExiste(idTurma: number): Promise<boolean> {
    const resultado = await pool.query<TotalRow>(
      'SELECT COUNT(*)::int AS total FROM turma WHERE id_turma = $1',
      [idTurma],
    );

    return resultado.rows[0].total > 0;
  }

  //função para filtros do dashboard
  async obterDashboard(filtros: DashboardFiltros): Promise<DashboardDados> {
    const [
      indicadoresGerais,
      frequenciaPorTurma,
      empregabilidade,
      concluintesNoPeriodo,
    ] = await Promise.all([
      this.obterIndicadoresGerais(filtros),
      this.obterFrequenciaPorTurma(filtros),
      this.obterEmpregabilidade(filtros),
      this.obterConcluintesNoPeriodo(filtros),
    ]);

    return {
      indicadores_gerais: indicadoresGerais,
      frequencia_por_turma: frequenciaPorTurma,
      empregabilidade,
      concluintes_no_periodo: concluintesNoPeriodo,
    };
  }

  // --------------- A partir daqui são funções que utilizam linguagem para utilizar CRUD no banco de dados -----------
  async obterFrequenciasDashboard(
    filtros: DashboardFrequenciaFiltros,
  ): Promise<DashboardFrequenciasDados> {
    const resultado = await pool.query<DashboardFrequenciaAluno>(
      `WITH frequencia_aluno AS (
         SELECT
           a.ra,
           a.nome,
           a.id_turma,
           t.nome_turma,
           COUNT(f.id_aula)::int AS total_aulas,
           COUNT(CASE WHEN f.frequencia THEN 1 END)::int AS presencas
       FROM aluno a
       LEFT JOIN turma t ON t.id_turma = a.id_turma
       LEFT JOIN frequenta f ON f.id_aluno = a.ra
       WHERE LOWER(a.status::text) = 'ativo'
         AND a.ex_aluno = false
         AND ($1::int IS NULL OR a.id_turma = $1)
         GROUP BY a.ra, a.nome, a.id_turma, t.nome_turma
       ),
       frequencia_calculada AS (
         SELECT
           ra,
           nome,
           id_turma,
           nome_turma,
           total_aulas,
           presencas,
           CASE
             WHEN total_aulas = 0 THEN 0
             ELSE ROUND((presencas::numeric / total_aulas::numeric) * 100, 1)
           END AS percentual_presenca
         FROM frequencia_aluno
       )
       SELECT
         ra,
         nome,
         id_turma,
         nome_turma,
         total_aulas,
         presencas,
         percentual_presenca::float AS percentual_presenca,
         (percentual_presenca < 85) AS alerta_evasao
       FROM frequencia_calculada
       WHERE ($2::boolean = false OR percentual_presenca < 85)
       ORDER BY nome`,
      [filtros.id_turma ?? null, filtros.apenas_alertas ?? false],
    );

    return { alunos: resultado.rows };
  }

  async obterEmpregabilidadeDashboard(
    filtros: DashboardEmpregabilidadeFiltros,
  ): Promise<DashboardEmpregabilidade> {
    return this.obterEmpregabilidade(filtros);
  }

  // dados para o endpoint do RF11 de alertas de evasão
  async obterAlertasEvasao(
    filtros: DashboardAlertasFiltros,
  ): Promise<DashboardAlertasEvasaoDados> {
    const resultado = await pool.query<DashboardAlertaEvasao>(
      `SELECT
         al.id_alerta,
         a.ra,
         a.nome AS nome_aluno,
         a.id_turma,
         t.nome_turma,
         CASE
           WHEN al.tipo = 2 OR LOWER(COALESCE(al.motivo, '')) LIKE '%ativ%' THEN 'atividades'
           WHEN al.tipo = 1 OR LOWER(COALESCE(al.motivo, '')) LIKE '%frequ%' THEN 'frequencia'
           ELSE 'outros'
         END AS motivo,
         al.motivo AS descricao,
         0::int AS total_faltas_modulo,
         0::int AS atividades_consecutivas_nao_entregues,
         CASE
           WHEN LOWER(COALESCE(al.status::text, '')) IN ('true', 'ativo') THEN 'ativo'
           ELSE 'resolvido'
         END AS status,
         al.data_inicio::text AS data_alerta,
         al.data_resolucao::text AS data_resolucao
       FROM alerta al
       JOIN aluno a ON a.ra = al.id_aluno
       LEFT JOIN turma t ON t.id_turma = a.id_turma
       WHERE LOWER(a.status::text) = 'ativo'
         AND ($1::int IS NULL OR a.id_turma = $1)
         AND (
           $2::text IS NULL
           OR $2 = 'todos'
           OR CASE
             WHEN LOWER(COALESCE(al.status::text, '')) IN ('true', 'ativo') THEN 'ativo'
             ELSE 'resolvido'
           END = $2
         )
         AND (
           $3::text IS NULL
           OR (
             $3 = 'atividades'
             AND (al.tipo = 2 OR LOWER(COALESCE(al.motivo, '')) LIKE '%ativ%')
           )
           OR (
             $3 = 'frequencia'
             AND (al.tipo = 1 OR LOWER(COALESCE(al.motivo, '')) LIKE '%frequ%')
           )
         )
       ORDER BY al.data_inicio DESC, al.id_alerta DESC`,
      [
        filtros.id_turma ?? null,
        filtros.status ?? null,
        filtros.motivo ?? null,
      ],
    );

    return { alertas: resultado.rows };
  }

  async resolverAlerta(idAlerta: number, dataResolucao: string): Promise<boolean> {
    const resultado = await pool.query(
      `UPDATE alerta
       SET status = false,
           data_resolucao = $1
       WHERE id_alerta = $2`,
      [dataResolucao, idAlerta],
    );

    return (resultado.rowCount ?? 0) > 0;
  }

  private async obterIndicadoresGerais(
    filtros: DashboardFiltros,
  ): Promise<DashboardIndicadoresGerais> {
    const totalAlunosAtivos = await pool.query<TotalRow>(
      `SELECT COUNT(*)::int AS total
       FROM aluno
       WHERE LOWER(status::text) = 'ativo'
         AND ex_aluno = false
         AND ($1::int IS NULL OR id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    const totalAlunosFormados = await pool.query<TotalRow>(
      `SELECT COUNT(*)::int AS total
       FROM aluno
       WHERE (LOWER(status::text) = 'formado' OR ex_aluno = true)
         AND ($1::int IS NULL OR id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    const totalJovensEmpregados = await pool.query<TotalRow>(
      `SELECT COUNT(DISTINCT e.id_aluno)::int AS total
       FROM empregabilidade e
       JOIN aluno a ON a.ra = e.id_aluno
       WHERE e.data_encerramento IS NULL
         AND LOWER(a.status::text) IN ('ativo', 'formado')
         AND ($1::int IS NULL OR a.id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    const totalAlertasEvasaoAtivos = await pool.query<TotalRow>(
      `SELECT COUNT(DISTINCT al.id_alerta)::int AS total
       FROM alerta al
       JOIN aluno a ON a.ra = al.id_aluno
       WHERE LOWER(a.status::text) = 'ativo'
         AND LOWER(al.status::text) IN ('ativo', 'aberto', 'true', '1')
         AND ($1::int IS NULL OR a.id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    return {
      total_alunos_ativos: totalAlunosAtivos.rows[0].total,
      total_alunos_formados: totalAlunosFormados.rows[0].total,
      total_jovens_empregados: totalJovensEmpregados.rows[0].total,
      total_alertas_evasao_ativos: totalAlertasEvasaoAtivos.rows[0].total,
    };
  }

  private async obterFrequenciaPorTurma(
    filtros: DashboardFiltros,
  ): Promise<DashboardFrequenciaPorTurma[]> {
    const resultado = await pool.query<DashboardFrequenciaPorTurma>(
      `WITH frequencia_aluno AS (
         SELECT
           a.ra,
           a.id_turma,
           COUNT(f.id_aula)::int AS total_aulas,
           COUNT(CASE WHEN f.frequencia THEN 1 END)::int AS presencas
       FROM aluno a
       LEFT JOIN frequenta f ON f.id_aluno = a.ra
       WHERE LOWER(a.status::text) = 'ativo'
         AND a.ex_aluno = false
         AND ($1::int IS NULL OR a.id_turma = $1)
         GROUP BY a.ra, a.id_turma
       ),
       frequencia_calculada AS (
         SELECT
           ra,
           id_turma,
           CASE
             WHEN total_aulas = 0 THEN 0
             ELSE ROUND((presencas::numeric / total_aulas::numeric) * 100, 1)
           END AS percentual_presenca
         FROM frequencia_aluno
       )
       SELECT
         t.id_turma,
         t.nome_turma,
         COALESCE(ROUND(AVG(fc.percentual_presenca), 1), 0)::float AS media_presenca_percentual,
         COUNT(CASE WHEN COALESCE(fc.percentual_presenca, 0) < 85 THEN 1 END)::int AS alunos_em_risco
       FROM turma t
       LEFT JOIN frequencia_calculada fc ON fc.id_turma = t.id_turma
       WHERE ($1::int IS NULL OR t.id_turma = $1)
       GROUP BY t.id_turma, t.nome_turma
       ORDER BY t.id_turma`,
      [filtros.id_turma ?? null],
    );

    return resultado.rows;
  }

  private async obterEmpregabilidade(
    filtros: DashboardFiltros,
  ): Promise<DashboardEmpregabilidade> {
    const totalEmpregadosAtivos = await pool.query<TotalRow>(
      `SELECT COUNT(DISTINCT e.id_aluno)::int AS total
       FROM empregabilidade e
       JOIN aluno a ON a.ra = e.id_aluno
       WHERE e.data_encerramento IS NULL
         AND LOWER(a.status::text) IN ('ativo', 'formado')
         AND ($1::int IS NULL OR a.id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    const taxas = await pool.query<TaxasRetencaoRow>(
      `SELECT
         COALESCE(
           ROUND(
             COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '3 months'
                         AND data_encerramento IS NULL THEN 1 END)::numeric
             / NULLIF(COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '3 months' THEN 1 END), 0)
             * 100,
             1
           ),
           0
         )::float AS taxa_retencao_3_meses,
         COALESCE(
           ROUND(
             COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '6 months'
                         AND data_encerramento IS NULL THEN 1 END)::numeric
             / NULLIF(COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '6 months' THEN 1 END), 0)
             * 100,
             1
           ),
           0
         )::float AS taxa_retencao_6_meses,
         COALESCE(
           ROUND(
             COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '12 months'
                         AND data_encerramento IS NULL THEN 1 END)::numeric
             / NULLIF(COUNT(CASE WHEN data_inicio <= CURRENT_DATE - INTERVAL '12 months' THEN 1 END), 0)
             * 100,
             1
           ),
           0
         )::float AS taxa_retencao_12_meses
       FROM empregabilidade e
       JOIN aluno a ON a.ra = e.id_aluno
       WHERE LOWER(a.status::text) IN ('ativo', 'formado')
         AND ($1::int IS NULL OR a.id_turma = $1)`,
      [filtros.id_turma ?? null],
    );

    return {
      total_empregados_ativos: totalEmpregadosAtivos.rows[0].total,
      taxa_retencao_3_meses: taxas.rows[0].taxa_retencao_3_meses,
      taxa_retencao_6_meses: taxas.rows[0].taxa_retencao_6_meses,
      taxa_retencao_12_meses: taxas.rows[0].taxa_retencao_12_meses,
    };
  }

  private async obterConcluintesNoPeriodo(
    filtros: DashboardFiltros,
  ): Promise<DashboardConcluintesNoPeriodo> {
    const resultado = await pool.query<TotalRow>(
      `SELECT COUNT(*)::int AS total
       FROM aluno
       WHERE (LOWER(status::text) = 'formado' OR ex_aluno = true)
         AND data_conclusao IS NOT NULL
         AND ($1::date IS NULL OR data_conclusao >= $1)
         AND ($2::date IS NULL OR data_conclusao <= $2)
         AND ($3::int IS NULL OR id_turma = $3)`,
      [
        filtros.periodo_inicio ?? null,
        filtros.periodo_fim ?? null,
        filtros.id_turma ?? null,
      ],
    );

    return {
      periodo_inicio: filtros.periodo_inicio ?? null,
      periodo_fim: filtros.periodo_fim ?? null,
      total_concluintes: resultado.rows[0].total,
    };
  }
}
