import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardService - RF10', () => {
  const dashboard = {
    indicadores_gerais: {
      total_alunos_ativos: 87,
      total_alunos_formados: 180,
      total_jovens_empregados: 75,
      total_alertas_evasao_ativos: 3,
    },
    frequencia_por_turma: [
      {
        id_turma: 1,
        nome_turma: 'Turma 1 - 2026',
        media_presenca_percentual: 91.5,
        alunos_em_risco: 2,
      },
    ],
    empregabilidade: {
      total_empregados_ativos: 75,
      taxa_retencao_3_meses: 68,
      taxa_retencao_6_meses: 61,
      taxa_retencao_12_meses: 55,
    },
    concluintes_no_periodo: {
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-12-31',
      total_concluintes: 42,
    },
  };

  const frequencias = {
    alunos: [
      {
        ra: 101,
        nome: 'Carlos Sales',
        id_turma: 1,
        nome_turma: 'Turma 1 - 2026',
        total_aulas: 20,
        presencas: 15,
        percentual_presenca: 75,
        alerta_evasao: true,
      },
    ],
  };

  const makeRepository = () =>
    ({
      turmaExiste: jest.fn(),
      obterDashboard: jest.fn(),
      obterFrequenciasDashboard: jest.fn(),
    } as unknown as jest.Mocked<DashboardRepository>);

  it('deve retornar o dashboard consolidado sem filtros', async () => {
    const repository = makeRepository();
    repository.obterDashboard.mockResolvedValueOnce(dashboard);
    const service = new DashboardService(repository);

    const resultado = await service.obterDashboard({});

    expect(repository.turmaExiste).not.toHaveBeenCalled();
    expect(repository.obterDashboard).toHaveBeenCalledWith({});
    expect(resultado).toEqual(dashboard);
  });

  it('deve validar a turma e repassar filtros do dashboard', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(true);
    repository.obterDashboard.mockResolvedValueOnce(dashboard);
    const service = new DashboardService(repository);

    await service.obterDashboard({
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-12-31',
      id_turma: 1,
    });

    expect(repository.turmaExiste).toHaveBeenCalledWith(1);
    expect(repository.obterDashboard).toHaveBeenCalledWith({
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-12-31',
      id_turma: 1,
    });
  });

  it('deve rejeitar periodo_inicio maior que periodo_fim', async () => {
    const repository = makeRepository();
    const service = new DashboardService(repository);

    await expect(service.obterDashboard({
      periodo_inicio: '2026-12-31',
      periodo_fim: '2026-01-01',
    })).rejects.toMatchObject({
      message: 'periodo_inicio nao pode ser maior que periodo_fim.',
      status: 400,
    });
    expect(repository.obterDashboard).not.toHaveBeenCalled();
  });

  it('deve retornar 404 quando a turma do dashboard nao existir', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(false);
    const service = new DashboardService(repository);

    await expect(service.obterDashboard({ id_turma: 99 })).rejects.toMatchObject({
      message: 'Turma nao encontrada.',
      status: 404,
    });
    expect(repository.obterDashboard).not.toHaveBeenCalled();
  });

  it('deve retornar frequencias do dashboard com filtros validos', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(true);
    repository.obterFrequenciasDashboard.mockResolvedValueOnce(frequencias);
    const service = new DashboardService(repository);

    const resultado = await service.obterFrequenciasDashboard({
      id_turma: 1,
      apenas_alertas: true,
    });

    expect(repository.turmaExiste).toHaveBeenCalledWith(1);
    expect(repository.obterFrequenciasDashboard).toHaveBeenCalledWith({
      id_turma: 1,
      apenas_alertas: true,
    });
    expect(resultado).toEqual(frequencias);
  });

  it('deve retornar 404 quando a turma de frequencia nao existir', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(false);
    const service = new DashboardService(repository);

    await expect(service.obterFrequenciasDashboard({ id_turma: 99 })).rejects.toMatchObject({
      message: 'Turma nao encontrada.',
      status: 404,
    });
    expect(repository.obterFrequenciasDashboard).not.toHaveBeenCalled();
  });

  it('deve retornar apenas a empregabilidade do dashboard', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(true);
    repository.obterDashboard.mockResolvedValueOnce(dashboard);
    const service = new DashboardService(repository);

    const resultado = await service.obterEmpregabilidadeDashboard({ id_turma: 1 });

    expect(repository.turmaExiste).toHaveBeenCalledWith(1);
    expect(repository.obterDashboard).toHaveBeenCalledWith({ id_turma: 1 });
    expect(resultado).toEqual(dashboard.empregabilidade);
  });
});
