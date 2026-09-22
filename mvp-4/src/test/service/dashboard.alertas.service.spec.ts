import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardService - RF11 Alertas de Evasao', () => {
  const alertas = {
    alertas: [
      {
        id_alerta: 12,
        ra: 102,
        nome_aluno: 'Ana Lima',
        id_turma: 1,
        nome_turma: 'Turma 1 - 2026',
        motivo: 'frequencia',
        descricao: 'Frequencia abaixo do limite exigido.',
        total_faltas_modulo: 1,
        atividades_consecutivas_nao_entregues: 0,
        status: 'ativo',
        data_alerta: '2026-05-20',
      },
    ],
  };

  const makeRepository = () =>
    ({
      turmaExiste: jest.fn(),
      obterAlertasEvasao: jest.fn(),
    } as unknown as jest.Mocked<DashboardRepository>);

  it('deve listar alertas sem filtros', async () => {
    const repository = makeRepository();
    repository.obterAlertasEvasao.mockResolvedValueOnce(alertas);
    const service = new DashboardService(repository);

    const resultado = await service.obterAlertasEvasao({});

    expect(repository.turmaExiste).not.toHaveBeenCalled();
    expect(repository.obterAlertasEvasao).toHaveBeenCalledWith({});
    expect(resultado).toEqual(alertas);
  });

  it('deve validar turma quando id_turma for informado', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(true);
    repository.obterAlertasEvasao.mockResolvedValueOnce(alertas);
    const service = new DashboardService(repository);

    await service.obterAlertasEvasao({ id_turma: 1 });

    expect(repository.turmaExiste).toHaveBeenCalledWith(1);
    expect(repository.obterAlertasEvasao).toHaveBeenCalledWith({ id_turma: 1 });
  });

  it('deve repassar filtros de status e motivo', async () => {
    const repository = makeRepository();
    repository.obterAlertasEvasao.mockResolvedValueOnce(alertas);
    const service = new DashboardService(repository);

    await service.obterAlertasEvasao({ status: 'ativo', motivo: 'frequencia' });

    expect(repository.obterAlertasEvasao).toHaveBeenCalledWith({
      status: 'ativo',
      motivo: 'frequencia',
    });
  });

  it('deve repassar filtro status todos', async () => {
    const repository = makeRepository();
    repository.obterAlertasEvasao.mockResolvedValueOnce(alertas);
    const service = new DashboardService(repository);

    await service.obterAlertasEvasao({ status: 'todos' });

    expect(repository.obterAlertasEvasao).toHaveBeenCalledWith({ status: 'todos' });
  });

  it('deve retornar lista vazia quando nao houver alertas', async () => {
    const repository = makeRepository();
    repository.obterAlertasEvasao.mockResolvedValueOnce({ alertas: [] });
    const service = new DashboardService(repository);

    const resultado = await service.obterAlertasEvasao({ motivo: 'atividades' });

    expect(resultado).toEqual({ alertas: [] });
  });

  it('deve retornar 404 quando a turma filtrada nao existir', async () => {
    const repository = makeRepository();
    repository.turmaExiste.mockResolvedValueOnce(false);
    const service = new DashboardService(repository);

    await expect(service.obterAlertasEvasao({ id_turma: 99 })).rejects.toMatchObject({
      message: 'Turma nao encontrada.',
      status: 404,
    });
    expect(repository.obterAlertasEvasao).not.toHaveBeenCalled();
  });

  it('deve propagar erro inesperado do repository', async () => {
    const repository = makeRepository();
    repository.obterAlertasEvasao.mockRejectedValueOnce(new Error('Erro no banco'));
    const service = new DashboardService(repository);

    await expect(service.obterAlertasEvasao({})).rejects.toThrow('Erro no banco');
  });
});
