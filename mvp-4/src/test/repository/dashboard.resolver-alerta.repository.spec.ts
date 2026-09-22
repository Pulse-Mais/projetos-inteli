import pool from '../../database/connection';
import { DashboardRepository } from '../../repositories/dashboard.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('DashboardRepository - resolver alerta', () => {
  const queryMock = pool.query as jest.Mock;
  const repository = new DashboardRepository();

  beforeEach(() => queryMock.mockReset());

  it('deve atualizar status e data de resolucao', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    await expect(repository.resolverAlerta(12, '2026-06-11')).resolves.toBe(true);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE alerta'),
      ['2026-06-11', 12],
    );
  });

  it('deve retornar false quando alerta nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    await expect(repository.resolverAlerta(99, '2026-06-11')).resolves.toBe(false);
  });
});
