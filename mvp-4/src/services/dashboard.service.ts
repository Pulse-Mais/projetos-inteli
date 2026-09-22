import {
  DashboardDados,
  DashboardEmpregabilidade,
  DashboardFrequenciasDados,
  DashboardRepository,
} from '../repositories/dashboard.repository';

export interface DashboardFiltros {
  periodo_inicio?: string;
  periodo_fim?: string;
  id_turma?: number;
}

// Filtros para o endpoint de frequencia do dashboard
export interface DashboardFrequenciaFiltros {
  id_turma?: number;
  apenas_alertas?: boolean;
}

// filtro para o endpoint 2
export interface DashboardEmpregabilidadeFiltros {
  id_turma?: number;
}

export interface DashboardAlertasFiltros {
  id_turma?: number;
  status?: string;
  motivo?: string;
}

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async obterDashboard(filtros: DashboardFiltros): Promise<DashboardDados> {
    this.validarPeriodo(filtros);

    if (filtros.id_turma) {
      const turmaExiste = await this.dashboardRepository.turmaExiste(filtros.id_turma);

      if (!turmaExiste) {
        const erro: any = new Error('Turma nao encontrada.');
        erro.status = 404;
        throw erro;
      }
    }

    return this.dashboardRepository.obterDashboard(filtros);
  }

  // função para obter frequência do Dashboard para o endpoint de frequência
  async obterFrequenciasDashboard(
    filtros: DashboardFrequenciaFiltros,
  ): Promise<DashboardFrequenciasDados> {
    if (filtros.id_turma) {
      const turmaExiste = await this.dashboardRepository.turmaExiste(filtros.id_turma);

      if (!turmaExiste) {
        const erro: any = new Error('Turma nao encontrada.');
        erro.status = 404;
        throw erro;
      }
    }

    return this.dashboardRepository.obterFrequenciasDashboard(filtros);
  }

  // função destinada para o endpoint 2 de empregabilidade
  async obterEmpregabilidadeDashboard(
    filtros: DashboardEmpregabilidadeFiltros,
  ): Promise<DashboardEmpregabilidade> {
    if (filtros.id_turma) {
      const turmaExiste = await this.dashboardRepository.turmaExiste(filtros.id_turma);

      if (!turmaExiste) {
        const erro: any = new Error('Turma nao encontrada.');
        erro.status = 404;
        throw erro;
      }
    }

    const dashboard = await this.dashboardRepository.obterDashboard({
      id_turma: filtros.id_turma,
    });

    return dashboard.empregabilidade;
  }

  // função para endpoint do RF11 de alertas de evasão
  async obterAlertasEvasao(filtros: DashboardAlertasFiltros): Promise<unknown> {
    if (filtros.id_turma) {
      const turmaExiste = await this.dashboardRepository.turmaExiste(filtros.id_turma);

      if (!turmaExiste) {
        const erro: any = new Error('Turma nao encontrada.');
        erro.status = 404;
        throw erro;
      }
    }

    const repository = this.dashboardRepository as DashboardRepository & {
      obterAlertasEvasao(filtros: DashboardAlertasFiltros): Promise<unknown>;
    };

    return repository.obterAlertasEvasao(filtros);
  }

  async resolverAlerta(idAlerta: number, dataResolucao: string): Promise<void> {
    if (!Number.isInteger(idAlerta) || idAlerta <= 0) {
      const erro: any = new Error('id_alerta invalido.');
      erro.status = 400;
      throw erro;
    }

    if (Number.isNaN(Date.parse(dataResolucao))) {
      const erro: any = new Error('data_resolucao invalida.');
      erro.status = 400;
      throw erro;
    }

    const resolvido = await this.dashboardRepository.resolverAlerta(idAlerta, dataResolucao);
    if (!resolvido) {
      const erro: any = new Error('Alerta nao encontrado.');
      erro.status = 404;
      throw erro;
    }
  }

  //valida periodo inicio e fim  de turma, impedindo periodos contraditórios
  private validarPeriodo(filtros: DashboardFiltros): void {
    const { periodo_inicio, periodo_fim } = filtros;

    if (!periodo_inicio || !periodo_fim) {
      return;
    }

    if (new Date(periodo_inicio) > new Date(periodo_fim)) {
      const erro: any = new Error('periodo_inicio nao pode ser maior que periodo_fim.');
      erro.status = 400;
      throw erro;
    }
  }
}
