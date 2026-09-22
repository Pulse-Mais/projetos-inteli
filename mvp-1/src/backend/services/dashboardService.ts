import * as repo from '../repositories/dashboardRepository';

export interface DashboardData {
  total_alunos_ativos: number;
  total_conectados: number;
  total_capacitados: number;
  total_transformados: number;
  taxa_empregabilidade: number;
  alunos_por_programa: repo.AlunoPorPrograma[];
}

/**
 * Agrega as métricas do dashboard em 6 consultas paralelas:
 * - Contagem de alunos ativos
 * - Contagem de alunos com histórico profissional (base da taxa de empregabilidade)
 * - Alunos matriculados agrupados por programa
 * - Contagem por categoria de ingresso (conectado, capacitado, transformado)
 *
 * Taxa de empregabilidade = (alunos com histórico / alunos ativos) × 100.
 */
export async function getDashboard(): Promise<DashboardData> {
  const [totalAtivos, comHistorico, porPrograma, conectados, capacitados, transformados] =
    await Promise.all([
      repo.countAlunosAtivos(),
      repo.countAlunosComHistorico(),
      repo.alunosPorPrograma(),
      repo.countByCategoria('conectado'),
      repo.countByCategoria('capacitado'),
      repo.countByCategoria('transformado'),
    ]);

  const taxa =
    totalAtivos > 0
      ? parseFloat(((comHistorico / totalAtivos) * 100).toFixed(2))
      : 0;

  return {
    total_alunos_ativos: totalAtivos,
    total_conectados: conectados,
    total_capacitados: capacitados,
    total_transformados: transformados,
    taxa_empregabilidade: taxa,
    alunos_por_programa: porPrograma,
  };
}
