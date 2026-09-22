import { Request, Response } from 'express';
import { AlunoController } from '../../controllers/aluno.controller';
import { AlunoService } from '../../services/aluno.service';

describe('AlunoController', () => {
  const makeService = () =>
    ({ buscarPorRA: jest.fn(), atualizar: jest.fn() } as unknown as jest.Mocked<AlunoService>);

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeReq = (params: object) =>
    ({ params } as unknown as Request);

  it('deve retornar 200 com os dados do aluno', async () => {
    const service = makeService();
    const aluno = {
      ra: 1,
      nome: 'Carlos Sales',
      cpf: '12345678900',
      foto: 'foto.png',
      data_nasc: '2000-01-01',
      id_turma: 1,
      status: 'ativo',
      genero: 'masculino',
      email_primario: 'carlos@email.com',
      tel_primario: '11999999999',
      cep: '00000000',
      endereco: 'Rua Teste',
      renda_familiar: '1000',
    };
    service.buscarPorRA.mockResolvedValueOnce(aluno);

    const controller = new AlunoController(service);
    const res = makeRes();

    await controller.buscarPorRa(makeReq({ ra: '1' }), res);

    expect(service.buscarPorRA).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(aluno);
  });

  it('deve retornar 404 quando aluno nao for encontrado', async () => {
    const service = makeService();
    service.buscarPorRA.mockResolvedValueOnce(null);

    const controller = new AlunoController(service);
    const res = makeRes();

    await controller.buscarPorRa(makeReq({ ra: '99' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Aluno nao encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro inesperado', async () => {
    const service = makeService();
    service.buscarPorRA.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new AlunoController(service);
    const res = makeRes();

    await controller.buscarPorRa(makeReq({ ra: '1' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar aluno.' });
  });

  it('deve retornar 400 quando RA da busca for invalido', async () => {
    const service = makeService();
    const controller = new AlunoController(service);
    const res = makeRes();

    await controller.buscarPorRa(makeReq({ ra: 'abc' }), res);

    expect(service.buscarPorRA).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RA invalido.' });
  });

  it('deve retornar 200 ao atualizar dados do aluno', async () => {
    const service = makeService();
    service.atualizar.mockResolvedValueOnce(undefined);

    const controller = new AlunoController(service);
    const req = { params: { ra: '1' }, body: { email_primario: 'novo@email.com' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Dados atualizados com sucesso.' });
  });

  it('deve retornar 404 quando aluno nao for encontrado no atualizar', async () => {
    const service = makeService();
    service.atualizar.mockRejectedValueOnce(new Error('Aluno nao encontrado.'));

    const controller = new AlunoController(service);
    const req = { params: { ra: '99' }, body: { email_primario: 'novo@email.com' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Aluno nao encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro inesperado no atualizar', async () => {
    const service = makeService();
    service.atualizar.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new AlunoController(service);
    const req = { params: { ra: '1' }, body: { email_primario: 'novo@email.com' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao tentar alterar dados.' });
  });

  it('deve retornar 400 quando RA do atualizar for invalido', async () => {
    const service = makeService();
    const controller = new AlunoController(service);
    const req = { params: { ra: 'abc' }, body: { email_primario: 'novo@email.com' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(service.atualizar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RA invalido.' });
  });

  it('deve retornar 400 quando atualizar sem campos', async () => {
    const service = makeService();
    const controller = new AlunoController(service);
    const req = { params: { ra: '1' }, body: {} } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(service.atualizar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Informe ao menos um campo para atualizar.' });
  });

  it('deve retornar 400 quando atualizar campos bloqueados ou inexistentes', async () => {
    const service = makeService();
    const controller = new AlunoController(service);
    const req = { params: { ra: '1' }, body: { cpf: '00000000000', campo_inexistente: 'x' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(service.atualizar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Campos invalidos para atualizacao.',
      campos: ['cpf', 'campo_inexistente'],
    });
  });

  it('deve retornar 400 quando a foto tiver formato invalido', async () => {
    const service = makeService();
    service.atualizar.mockRejectedValueOnce(new Error('Formato de foto invalido. Envie PNG, JPG ou WEBP.'));

    const controller = new AlunoController(service);
    const req = { params: { ra: '1' }, body: { foto: 'data:text/plain;base64,Zm9v' } } as unknown as Request;
    const res = makeRes();

    await controller.atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de foto invalido. Envie PNG, JPG ou WEBP.' });
  });
});
