import { Request, Response } from 'express';
import { DashboardController } from '../../controllers/dashboard.controller';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardController - resolver alerta', () => {
  const makeService = () => ({
    resolverAlerta: jest.fn(),
  } as unknown as jest.Mocked<DashboardService>);

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('deve resolver alerta com data informada', async () => {
    const service = makeService();
    service.resolverAlerta.mockResolvedValueOnce(undefined);
    const res = makeRes();

    await new DashboardController(service).resolverAlerta({
      params: { id: '12' },
      body: { data_resolucao: '2026-06-11' },
    } as unknown as Request, res);

    expect(service.resolverAlerta).toHaveBeenCalledWith(12, '2026-06-11');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Alerta resolvido com sucesso.' });
  });

  it('deve retornar erro conhecido do service', async () => {
    const service = makeService();
    service.resolverAlerta.mockRejectedValueOnce(
      Object.assign(new Error('Alerta nao encontrado.'), { status: 404 }),
    );
    const res = makeRes();

    await new DashboardController(service).resolverAlerta({
      params: { id: '99' },
      body: { data_resolucao: '2026-06-11' },
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Alerta nao encontrado.' });
  });

  it('deve retornar 500 em erro inesperado', async () => {
    const service = makeService();
    service.resolverAlerta.mockRejectedValueOnce(new Error('Erro no banco'));
    const res = makeRes();

    await new DashboardController(service).resolverAlerta({
      params: { id: '12' },
      body: { data_resolucao: '2026-06-11' },
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao resolver alerta.' });
  });
});
