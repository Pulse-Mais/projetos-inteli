import { Request, Response } from 'express';
import pool from '../../database/connection';
import { DashboardController } from '../../controllers/dashboard.controller';
import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardService } from '../../services/dashboard.service';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Dashboard RF11 - integracao Controller + Repository', () => {
  const queryMock = pool.query as jest.Mock;

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeController = () => {
    const repository = new DashboardRepository();
    const service = new DashboardService(repository);
    return new DashboardController(service);
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /gestao/alertas deve retornar alertas filtrados por turma, status e motivo', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id_alerta: 12,
            ra: 102,
            nome_aluno: 'Ana Lima',
            id_turma: 1,
            nome_turma: 'Turma 1 - 2026',
            motivo: 'frequencia',
            descricao: 'Frequencia abaixo do limite exigido.',
            total_faltas_modulo: 0,
            atividades_consecutivas_nao_entregues: 0,
            status: 'ativo',
            data_alerta: '2026-05-20',
          },
        ],
      });

    const req = {
      query: { id_turma: '1', status: 'ativo', motivo: 'frequencia' },
    } as unknown as Request;
    const res = makeRes();

    await makeController().obterAlertasEvasao(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      alertas: [
        {
          id_alerta: 12,
          ra: 102,
          nome_aluno: 'Ana Lima',
          id_turma: 1,
          nome_turma: 'Turma 1 - 2026',
          motivo: 'frequencia',
          descricao: 'Frequencia abaixo do limite exigido.',
          total_faltas_modulo: 0,
          atividades_consecutivas_nao_entregues: 0,
          status: 'ativo',
          data_alerta: '2026-05-20',
        },
      ],
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM turma WHERE id_turma = $1'),
      [1],
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM alerta al'),
      [1, 'ativo', 'frequencia'],
    );
  });

  it('GET /gestao/alertas deve retornar 404 quando turma filtrada nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const req = { query: { id_turma: '99' } } as unknown as Request;
    const res = makeRes();

    await makeController().obterAlertasEvasao(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Turma nao encontrada.' });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
