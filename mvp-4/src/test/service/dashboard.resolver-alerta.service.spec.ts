import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardService - resolver alerta', () => {
  const repository = {
    resolverAlerta: jest.fn(),
  } as unknown as jest.Mocked<DashboardRepository>;
  const service = new DashboardService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('deve resolver alerta existente', async () => {
    repository.resolverAlerta.mockResolvedValueOnce(true);

    await expect(service.resolverAlerta(12, '2026-06-11')).resolves.toBeUndefined();
    expect(repository.resolverAlerta).toHaveBeenCalledWith(12, '2026-06-11');
  });

  it('deve rejeitar id invalido', async () => {
    await expect(service.resolverAlerta(0, '2026-06-11')).rejects.toMatchObject({
      message: 'id_alerta invalido.',
      status: 400,
    });
    expect(repository.resolverAlerta).not.toHaveBeenCalled();
  });

  it('deve rejeitar data invalida', async () => {
    await expect(service.resolverAlerta(12, 'data-invalida')).rejects.toMatchObject({
      message: 'data_resolucao invalida.',
      status: 400,
    });
  });

  it('deve retornar 404 quando alerta nao existir', async () => {
    repository.resolverAlerta.mockResolvedValueOnce(false);

    await expect(service.resolverAlerta(99, '2026-06-11')).rejects.toMatchObject({
      message: 'Alerta nao encontrado.',
      status: 404,
    });
  });
});
