import { pool } from '../db/pool';
import { validarPerfil } from '../helpers/validarPerfil';
import * as frequenciaAulaRepo from '../repositories/frequenciaAulaRepository';
import * as participacaoEventoRepo from '../repositories/participacaoEventoRepository';
import * as computadorDoadoRepo from '../repositories/computadorDoadoRepository';
import * as empregabilidadeRepo from '../repositories/empregabilidadeRepository';
import * as ensinoSuperiorRepo from '../repositories/ensinoSuperiorRepository';
import type { SituacaoEmpregabilidade, SituacaoEnsinoSuperior } from '../models/enums';

const SIT_EMPREGO: SituacaoEmpregabilidade[] = ['Empregado', 'Procurando'];
const SIT_ENSINO: SituacaoEnsinoSuperior[] = ['Concluido', 'Cursando', 'Não possui'];

export interface DashboardEmpregabilidade {
  totalEmpregados: number;
  totalTransformados: number;
  taxaEmpregabilidade: number;
  taxaVariacao: number;
  deltaMedioRenda: number;
  tempoMedioEmprego: number;
  evolucaoPorAno: Array<{ ano: string; count: number }>;
  distribuicaoPorArea: Array<{ area: string; count: number }>;
  deltaRenda: Array<{ faixa: string; entrada: number; saida: number }>;
  progressaoMensal: Array<{ mes: string; count: number }>;
}

export interface DashboardEngajamento {
  conectados: number;
  capacitados: number;
  transformados: number;
  taxaSucesso: number;
  turmas: Array<{ turma: string; taxa: number }>;
  evasaoModulos: Array<{ modulo: string; taxa: number }>;
  participacaoEventos: Array<{ tipo: string; taxa: number }>;
  participacaoAulas: Array<{ trilha: string; taxa: number }>;
}

export interface DashboardEnsinoSuperior {
  totalIngressantes: number;
  totalTransformados: number;
  taxaIngresso: number;
  taxaVariacao: number;
  concluidos: number;
  pctConcluidos: number;
  totalInstituicoes: number;
  ingressosPorAno: Array<{ ano: string; count: number }>;
  situacao: Array<{ situacao: string; count: number }>;
  topInstituicoes: Array<{ instituicao: string; count: number }>;
  progressaoMensal: Array<{ mes: string; count: number }>;
}

export interface DashboardIndicadores {
  totalAtivos: number;
  totalEmpregados: number;
  totalGraduacao: number;
  percentualEvasao: number;
  totalTransformados: number;
  incrementoRendaMedio: number;
  totalComputadoresDoados: number;
  mapaPresenca: Array<{ id_jovem: number; taxa_presenca: number }>;
  calendarioEventos: Array<{ evento: string; data: Date; total_participantes: number }>;
}

/**
 * Agrega todos os indicadores do dashboard em paralelo.
 * Diagrama de sequência Gestão — p95 < 1 s graças ao Promise.all.
 * Requer perfil Gestao.
 */
export async function obterIndicadores(idUsuario: number): Promise<DashboardIndicadores> {
  await validarPerfil(idUsuario, ['Gestao']);

  const [
    totalAtivos,
    totalEmpregados,
    totalGraduacao,
    percentualEvasao,
    totalTransformados,
    incrementoRendaMedio,
    totalComputadoresDoados,
    mapaPresenca,
    calendarioEventos,
  ] = await Promise.all([
    contarAtivos(),
    contarEmpregados(),
    contarGraduacao(),
    calcularEvasao(),
    contarTransformados(),
    calcularIncrementoRenda(),
    contarComputadores(),
    frequenciaAulaRepo.buscarMapaPresenca(),
    participacaoEventoRepo.buscarCalendario(),
  ]);

  return {
    totalAtivos,
    totalEmpregados,
    totalGraduacao,
    percentualEvasao,
    totalTransformados,
    incrementoRendaMedio,
    totalComputadoresDoados,
    mapaPresenca,
    calendarioEventos,
  };
}

async function contarAtivos(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM jovem WHERE status_global = 'Ativo'`
  );
  return parseInt(rows[0].count, 10);
}

async function contarTransformados(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM jovem WHERE categoria_atual = 'Transformado'`
  );
  return parseInt(rows[0].count, 10);
}

async function calcularEvasao(): Promise<number> {
  const { rows } = await pool.query<{ total: string; evadidos: string }>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status_global = 'Evadido') AS evadidos
     FROM jovem`
  );
  const total = parseInt(rows[0].total, 10);
  if (total === 0) return 0;
  return parseFloat(((parseInt(rows[0].evadidos, 10) / total) * 100).toFixed(2));
}

async function contarEmpregados(): Promise<number> {
  return empregabilidadeRepo.contarEmpregados();
}

async function contarGraduacao(): Promise<number> {
  return ensinoSuperiorRepo.contarComIngressoSuperior();
}

async function calcularIncrementoRenda(): Promise<number> {
  return empregabilidadeRepo.calcularIncrementoRendaMedio();
}

async function contarComputadores(): Promise<number> {
  return computadorDoadoRepo.totalNaoDevolvidos();
}

export async function obterDashboardEmpregabilidade(
  situacaoFiltro: SituacaoEmpregabilidade = 'Empregado',
  ano?: number,
  programa?: number
): Promise<DashboardEmpregabilidade> {
  // Filtro por status aplicado às séries/distribuições de volume.
  // As métricas de renda permanecem atreladas a "Empregado" (renda só existe para empregados).
  const sit = SIT_EMPREGO.includes(situacaoFiltro) ? situacaoFiltro : 'Empregado';
  // Filtro opcional por ano (data_registro). $2 só existe quando há ano.
  const anoNum = ano && Number.isInteger(ano) ? ano : null;
  const anoClause = anoNum ? ' AND EXTRACT(YEAR FROM data_registro) = $2' : '';
  const volParams: unknown[] = anoNum ? [sit, anoNum] : [sit];
  // Filtro opcional por programa: restringe aos jovens inscritos no programa.
  // progNum é um inteiro validado (sem risco de injeção); interpolado para evitar
  // conflito de índices de parâmetro com $1/$2.
  const progNum = programa && Number.isInteger(programa) && programa > 0 ? programa : null;
  const inProg  = progNum ? `(SELECT id_jovem FROM inscricao_programa WHERE id_programa = ${progNum})` : '';
  const progEmp = progNum ? ` AND id_jovem IN ${inProg}` : '';   // tabela empregabilidade (sem alias)
  const progE   = progNum ? ` AND e.id_jovem IN ${inProg}` : ''; // alias e
  const progJ   = progNum ? ` AND id IN ${inProg}` : '';         // tabela jovem (entrada de renda)
  const usarInline = anoNum !== null || progNum !== null;        // KPIs precisam de query inline quando há filtro
  // Faixas de renda compartilhadas entre entrada (jovem.renda_inicial) e saída (empregabilidade.renda_atual).
  const FAIXA_SQL = `CASE
      WHEN renda < 1500 THEN 'Até R$1.500'
      WHEN renda < 2500 THEN 'R$1.500 – R$2.500'
      WHEN renda < 3500 THEN 'R$2.500 – R$3.500'
      WHEN renda < 5000 THEN 'R$3.500 – R$5.000'
      ELSE 'Acima de R$5.000'
    END`;
  const FAIXAS = ['Até R$1.500', 'R$1.500 – R$2.500', 'R$2.500 – R$3.500', 'R$3.500 – R$5.000', 'Acima de R$5.000'];

  const [
    totalEmpregados,
    totalTransformados,
    deltaMedioRenda,
    evolucaoPorAno,
    distribuicaoPorArea,
    progressaoMensal,
    variacao,
    deltaRendaRows,
    tempoMedio,
  ] = await Promise.all([
    usarInline
      ? pool.query<{ total: string }>(
          `SELECT COUNT(DISTINCT id_jovem) AS total FROM empregabilidade
            WHERE encerrado = 0 AND situacao = $1${anoClause}${progEmp}`,
          volParams
        ).then(r => Number(r.rows[0]?.total ?? 0))
      : empregabilidadeRepo.contarEmpregados(),
    contarTransformados(),
    usarInline
      ? pool.query<{ media: string | null }>(
          `SELECT AVG(e.renda_atual - j.renda_inicial) AS media
             FROM empregabilidade e JOIN jovem j ON e.id_jovem = j.id
            WHERE e.encerrado = 0 AND e.renda_atual IS NOT NULL AND j.renda_inicial IS NOT NULL${anoNum ? ' AND EXTRACT(YEAR FROM e.data_registro) = $1' : ''}${progE}`,
          anoNum ? [anoNum] : []
        ).then(r => parseFloat(r.rows[0]?.media ?? '0') || 0)
      : empregabilidadeRepo.calcularIncrementoRendaMedio(),
    pool.query<{ ano: string; count: string }>(
      `SELECT TO_CHAR(data_registro, 'YYYY') AS ano, COUNT(*) AS count
         FROM empregabilidade
        WHERE encerrado = 0 AND situacao = $1${anoClause}${progEmp}
        GROUP BY ano ORDER BY ano`,
      volParams
    ).then(r => r.rows.map(row => ({ ano: row.ano, count: Number(row.count) }))),
    pool.query<{ area: string; count: string }>(
      `SELECT COALESCE(area_atuacao, 'Outros') AS area, COUNT(*) AS count
         FROM empregabilidade
        WHERE encerrado = 0 AND situacao = $1${anoClause}${progEmp}
        GROUP BY area ORDER BY count DESC LIMIT 5`,
      volParams
    ).then(r => r.rows.map(row => ({ area: row.area, count: Number(row.count) }))),
    pool.query<{ mes: string; count: string }>(
      `SELECT TO_CHAR(data_registro, 'YYYY-MM') AS mes, COUNT(*) AS count
         FROM empregabilidade
        WHERE encerrado = 0 AND situacao = $1${anoNum
          ? ' AND EXTRACT(YEAR FROM data_registro) = $2'
          : " AND data_registro >= NOW() - INTERVAL '12 months'"}${progEmp}
        GROUP BY mes ORDER BY mes`,
      volParams
    ).then(r => r.rows.map(row => ({ mes: row.mes, count: Number(row.count) }))),
    pool.query<{ este_ano: string; ano_passado: string }>(
      anoNum
        ? `SELECT
             COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_registro) = $2) AS este_ano,
             COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_registro) = $2 - 1) AS ano_passado
             FROM empregabilidade WHERE encerrado = 0 AND situacao = $1${progEmp}`
        : `SELECT
             COUNT(*) FILTER (WHERE data_registro >= DATE_TRUNC('year', NOW())) AS este_ano,
             COUNT(*) FILTER (WHERE data_registro >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
                                AND data_registro  < DATE_TRUNC('year', NOW())) AS ano_passado
             FROM empregabilidade WHERE encerrado = 0 AND situacao = $1${progEmp}`,
      volParams
    ).then(r => r.rows[0]),
    // Distribuição entrada vs saída por faixa salarial.
    pool.query<{ faixa: string; entrada: string; saida: string }>(
      `WITH entrada AS (
         SELECT (${FAIXA_SQL.replace(/renda/g, 'renda_inicial')}) AS faixa, COUNT(*) AS n
           FROM jovem WHERE renda_inicial IS NOT NULL${progJ} GROUP BY 1
       ),
       saida AS (
         SELECT (${FAIXA_SQL.replace(/renda/g, 'renda_atual')}) AS faixa, COUNT(*) AS n
           FROM empregabilidade
          WHERE encerrado = 0 AND situacao = 'Empregado' AND renda_atual IS NOT NULL${progEmp}
          GROUP BY 1
       )
       SELECT f.faixa,
              COALESCE(e.n, 0) AS entrada,
              COALESCE(s.n, 0) AS saida
         FROM (SELECT UNNEST($1::text[]) AS faixa) f
         LEFT JOIN entrada e ON e.faixa = f.faixa
         LEFT JOIN saida   s ON s.faixa = f.faixa`,
      [FAIXAS]
    ).then(r => r.rows),
    // Tempo médio (meses) entre conclusão de programa e registro de emprego.
    // DATE - DATE = INTEGER (dias); divide por 30.44 para converter em meses.
    pool.query<{ media: string | null }>(
      `SELECT AVG((e.data_registro - ip.data_status) / 30.44) AS media
         FROM empregabilidade e
         JOIN inscricao_programa ip ON ip.id_jovem = e.id_jovem
        WHERE e.situacao = 'Empregado'
          AND ip.status_conclusao = 'Concluido'
          AND ip.data_status IS NOT NULL
          AND e.data_registro >= ip.data_status${anoNum ? ' AND EXTRACT(YEAR FROM e.data_registro) = $1' : ''}${progE}`,
      anoNum ? [anoNum] : []
    ).then(r => r.rows[0]?.media),
  ]);

  const esteAno = Number(variacao?.este_ano ?? 0);
  const anoPassado = Number(variacao?.ano_passado ?? 0);
  const taxaVariacao = anoPassado > 0 ? parseFloat(((esteAno - anoPassado) / anoPassado * 100).toFixed(1)) : 0;
  // Uma taxa de empregabilidade não pode exceder 100%. Como o total de empregados
  // pode incluir jovens de outras categorias além de "Transformado", limita-se a 100%.
  const taxaEmpregabilidade = totalTransformados > 0
    ? Math.min(100, parseFloat((totalEmpregados / totalTransformados * 100).toFixed(1)))
    : 0;

  // Reordena as faixas e remove as que não têm nenhum registro nos dois lados.
  const deltaRenda = FAIXAS
    .map(faixa => {
      const row = deltaRendaRows.find(r => r.faixa === faixa);
      return { faixa, entrada: Number(row?.entrada ?? 0), saida: Number(row?.saida ?? 0) };
    })
    .filter(d => d.entrada > 0 || d.saida > 0);

  return {
    totalEmpregados,
    totalTransformados,
    taxaEmpregabilidade,
    taxaVariacao,
    deltaMedioRenda: parseFloat(deltaMedioRenda.toFixed(2)),
    tempoMedioEmprego: tempoMedio != null ? parseFloat(Number(tempoMedio).toFixed(1)) : 0,
    evolucaoPorAno,
    distribuicaoPorArea,
    deltaRenda,
    progressaoMensal,
  };
}

export async function obterDashboardEngajamento(ano?: number, programa?: number): Promise<DashboardEngajamento> {
  // Filtros opcionais por ano (métricas com data) e por programa (jovens inscritos).
  // A distribuição por categoria não tem data; só é afetada pelo filtro de programa.
  const anoNum = ano && Number.isInteger(ano) ? ano : null;
  const p = anoNum ? [anoNum] : [];
  const progNum = programa && Number.isInteger(programa) && programa > 0 ? programa : null;
  const inProg  = progNum ? `(SELECT id_jovem FROM inscricao_programa WHERE id_programa = ${progNum})` : '';
  const whereDe = (conds: (string | false | null)[]) => {
    const f = conds.filter(Boolean);
    return f.length ? `WHERE ${f.join(' AND ')}` : '';
  };
  const whereEvt   = whereDe([anoNum ? 'EXTRACT(YEAR FROM e.data) = $1' : null, progNum ? `pe.id_jovem IN ${inProg}` : null]);
  const whereAula  = whereDe([anoNum ? 'EXTRACT(YEAR FROM data) = $1' : null, progNum ? `id_jovem IN ${inProg}` : null]);
  const whereTurma = progNum ? `WHERE p.id = ${progNum}` : '';

  const { rows: cats } = await pool.query<{ categoria: string; count: string }>(
    `SELECT categoria_atual AS categoria, COUNT(*) AS count
       FROM jovem
      WHERE categoria_atual IS NOT NULL${progNum ? ` AND id IN ${inProg}` : ''}
      GROUP BY categoria_atual`
  );
  const byCategoria = Object.fromEntries(cats.map(r => [r.categoria, Number(r.count)]));
  const conectados    = byCategoria['Conectado']    ?? 0;
  const capacitados   = byCategoria['Capacitado']   ?? 0;
  const transformados = byCategoria['Transformado']  ?? 0;
  const total = conectados + capacitados + transformados;
  const taxaSucesso = total > 0 ? parseFloat((transformados / total * 100).toFixed(1)) : 0;

  const [participacaoEventos, participacaoAulas, turmas, evasaoModulos] = await Promise.all([
    pool.query<{ tipo: string; taxa: string }>(
      `SELECT e.nome AS tipo,
              ROUND(COUNT(*) FILTER (WHERE pe.presente = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS taxa
         FROM participacao_evento pe
         JOIN evento e ON pe.id_evento = e.id
        ${whereEvt}
        GROUP BY e.nome ORDER BY taxa DESC LIMIT 6`,
      p
    ).then(r => r.rows.map(row => ({ tipo: row.tipo, taxa: Number(row.taxa) }))),
    pool.query<{ trilha: string; taxa: string }>(
      `SELECT aula AS trilha,
              ROUND(COUNT(*) FILTER (WHERE presente = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS taxa
         FROM frequencia_aula
        ${whereAula}
        GROUP BY aula ORDER BY taxa DESC LIMIT 6`,
      p
    ).then(r => r.rows.map(row => ({ trilha: row.trilha, taxa: Number(row.taxa) }))),
    pool.query<{ turma: string; taxa: string }>(
      `SELECT p.nome AS turma,
              ROUND(
                COUNT(*) FILTER (WHERE ip.status_conclusao = 'Concluido')::NUMERIC
                / NULLIF(COUNT(*), 0) * 100, 1
              ) AS taxa
         FROM programa p
         LEFT JOIN inscricao_programa ip ON ip.id_programa = p.id${anoNum ? ' AND EXTRACT(YEAR FROM ip.data_matricula) = $1' : ''}
        ${whereTurma}
        GROUP BY p.id, p.nome ORDER BY p.nome`,
      p
    ).then(r => r.rows.map(row => ({ turma: row.turma, taxa: Number(row.taxa) }))),
    pool.query<{ modulo: string; taxa: string }>(
      `SELECT p.nome AS modulo,
              ROUND(
                COUNT(*) FILTER (WHERE ip.status_conclusao = 'Evadido')::NUMERIC
                / NULLIF(COUNT(*), 0) * 100, 1
              ) AS taxa
         FROM programa p
         LEFT JOIN inscricao_programa ip ON ip.id_programa = p.id${anoNum ? ' AND EXTRACT(YEAR FROM ip.data_matricula) = $1' : ''}
        ${whereTurma}
        GROUP BY p.id, p.nome
       HAVING COUNT(ip.id) > 0
        ORDER BY taxa DESC LIMIT 6`,
      p
    ).then(r => r.rows.map(row => ({ modulo: row.modulo, taxa: Number(row.taxa) }))),
  ]);

  return {
    conectados,
    capacitados,
    transformados,
    taxaSucesso,
    turmas,
    evasaoModulos,
    participacaoEventos,
    participacaoAulas,
  };
}

export async function obterDashboardEnsinoSuperior(
  situacaoFiltro?: SituacaoEnsinoSuperior,
  ano?: number
): Promise<DashboardEnsinoSuperior> {
  // Filtros opcionais por status e por ano (combinados com AND).
  // Sem filtro de status, considera todos que ingressaram.
  const conds: string[] = [];
  const params: unknown[] = [];
  if (situacaoFiltro && SIT_ENSINO.includes(situacaoFiltro)) {
    params.push(situacaoFiltro);
    conds.push(`situacao = $${params.length}`);
  } else {
    conds.push('ingressou = 1');
  }
  const anoNum = ano && Number.isInteger(ano) ? ano : null;
  if (anoNum) {
    params.push(anoNum);
    conds.push(`EXTRACT(YEAR FROM data_registro) = $${params.length}`);
  }
  const where = conds.join(' AND ');

  const [
    totalIngressantes,
    totalTransformados,
    totalInstituicoes,
    situacao,
    topInstituicoes,
    ingressosPorAno,
    progressaoMensal,
    variacao,
  ] = await Promise.all([
    ensinoSuperiorRepo.contarComIngressoSuperior(),
    contarTransformados(),
    pool.query<{ count: string }>(
      `SELECT COUNT(DISTINCT instituicao) AS count FROM ensino_superior WHERE ${where} AND instituicao IS NOT NULL`,
      params
    ).then(r => Number(r.rows[0]?.count ?? 0)),
    pool.query<{ situacao: string; count: string }>(
      `SELECT COALESCE(situacao, 'Não informado') AS situacao, COUNT(*) AS count
         FROM ensino_superior WHERE ${where} GROUP BY situacao ORDER BY count DESC`,
      params
    ).then(r => r.rows.map(row => ({ situacao: row.situacao, count: Number(row.count) }))),
    pool.query<{ instituicao: string; count: string }>(
      `SELECT instituicao, COUNT(*) AS count
         FROM ensino_superior WHERE ${where} AND instituicao IS NOT NULL
        GROUP BY instituicao ORDER BY count DESC LIMIT 5`,
      params
    ).then(r => r.rows.map(row => ({ instituicao: row.instituicao, count: Number(row.count) }))),
    pool.query<{ ano: string; count: string }>(
      `SELECT TO_CHAR(data_registro, 'YYYY') AS ano, COUNT(*) AS count
         FROM ensino_superior WHERE ${where} GROUP BY ano ORDER BY ano`,
      params
    ).then(r => r.rows.map(row => ({ ano: row.ano, count: Number(row.count) }))),
    pool.query<{ mes: string; count: string }>(
      `SELECT TO_CHAR(data_registro, 'YYYY-MM') AS mes, COUNT(*) AS count
         FROM ensino_superior WHERE ${where}${anoNum
           ? ''
           : " AND data_registro >= NOW() - INTERVAL '12 months'"}
        GROUP BY mes ORDER BY mes`,
      params
    ).then(r => r.rows.map(row => ({ mes: row.mes, count: Number(row.count) }))),
    pool.query<{ este_ano: string; ano_passado: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE data_registro >= DATE_TRUNC('year', NOW())) AS este_ano,
         COUNT(*) FILTER (WHERE data_registro >= DATE_TRUNC('year', NOW()) - INTERVAL '1 year'
                            AND data_registro  < DATE_TRUNC('year', NOW())) AS ano_passado
         FROM ensino_superior WHERE ${where}`,
      params
    ).then(r => r.rows[0]),
  ]);

  const esteAno = Number(variacao?.este_ano ?? 0);
  const anoPassado = Number(variacao?.ano_passado ?? 0);
  const taxaVariacao = anoPassado > 0 ? parseFloat(((esteAno - anoPassado) / anoPassado * 100).toFixed(1)) : 0;
  // Uma taxa de ingresso no ensino superior não pode exceder 100%. Como o total de
  // ingressantes pode incluir jovens de outras categorias além de "Transformado",
  // limita-se a 100%.
  const taxaIngresso = totalTransformados > 0
    ? Math.min(100, parseFloat((totalIngressantes / totalTransformados * 100).toFixed(1)))
    : 0;

  // Concluídos derivados da distribuição por situação (novo domínio).
  const concluidos = situacao.find(s => s.situacao === 'Concluido')?.count ?? 0;
  const totalSituacao = situacao.reduce((acc, s) => acc + s.count, 0);
  const pctConcluidos = totalSituacao > 0 ? parseFloat((concluidos / totalSituacao * 100).toFixed(1)) : 0;

  return {
    totalIngressantes,
    totalTransformados,
    taxaIngresso,
    taxaVariacao,
    concluidos,
    pctConcluidos,
    totalInstituicoes,
    ingressosPorAno,
    situacao,
    topInstituicoes,
    progressaoMensal,
  };
}
