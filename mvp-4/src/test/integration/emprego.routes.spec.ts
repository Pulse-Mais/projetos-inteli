import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('EmpregoRoutes', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('POST /gestao/alunos/:ra/emprego deve registrar emprego', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ ra: 101 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id_emprego: 7 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/gestao/alunos/101/emprego')
      .send({
        empresa: 'Tech Corp',
        cargo: 'Dev Jr',
        data_inicio: '2026-05-01',
        faixa_salarial: '3000-5000',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Emprego registrado com sucesso. Status do aluno atualizado para Empregado.',
      id_emprego: 7,
    });
  });

  it('GET /gestao/alunos/:ra/emprego deve listar historico de empregos', async () => {
    const historico = [
      {
        id_emprego: 7,
        empresa: 'Tech Corp',
        cargo: 'Dev Jr',
        data_inicio: '2026-05-01',
        data_encerramento: null,
        faixa_salarial: '3000-5000',
        ativo: true,
      },
    ];

    queryMock
      .mockResolvedValueOnce({ rows: [{ ra: 101 }] })
      .mockResolvedValueOnce({ rows: historico });

    const response = await request(app).get('/gestao/alunos/101/emprego');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ra: 101,
      historico_empregos: historico,
    });
  });

  it('PATCH /gestao/alunos/:ra/emprego/:id_emprego deve encerrar emprego', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id_emprego: 7, data_inicio: '2026-05-01' }],
      })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/gestao/alunos/101/emprego/7')
      .send({ data_encerramento: '2026-12-31' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Emprego encerrado com sucesso. Registro mantido no historico.',
    });
  });

  it('PATCH /gestao/alunos/:ra/emprego/:id_emprego deve chegar na rota e validar body vazio', async () => {
    const response = await request(app).patch('/gestao/alunos/101/emprego/7').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'O corpo da requisição não pode estar vazio.',
    });
    expect(response.text).not.toContain('Cannot PATCH');
    expect(queryMock).not.toHaveBeenCalled();
  });
});
