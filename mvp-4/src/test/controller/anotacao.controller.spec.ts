import { Request, Response } from 'express';
import { AnotacaoController } from '../../controllers/anotacao.controller';
import { AnotacaoService } from '../../services/anotacao.service';

describe('AnotacaoController', () => {
  const anotacao = {
    id_anotacoes: 1,
    id_aluno: 101,
    nome_autor: 'Gabriela Ferreira - Psicologa',
    data: '2026-06-11',
    conteudo: 'Aluno apresentou evolucao.',
  };

  const makeService = () => ({
    listarPorAluno: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn(),
  } as unknown as jest.Mocked<AnotacaoService>);

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  it('GET deve retornar anotacoes e total', async () => {
    const service = makeService();
    service.listarPorAluno.mockResolvedValueOnce([anotacao]);
    const res = makeRes();

    await new AnotacaoController(service).listar(
      { params: { ra: '101' } } as unknown as Request,
      res,
    );

    expect(service.listarPorAluno).toHaveBeenCalledWith(101);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ anotacoes: [anotacao], total: 1 });
  });

  it('POST deve retornar anotacao criada', async () => {
    const service = makeService();
    service.criar.mockResolvedValueOnce(anotacao);
    const body = { nome_autor: anotacao.nome_autor, conteudo: anotacao.conteudo };
    const res = makeRes();

    await new AnotacaoController(service).criar(
      { params: { ra: '101' }, body } as unknown as Request,
      res,
    );

    expect(service.criar).toHaveBeenCalledWith(101, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(anotacao);
  });

  it('PATCH deve retornar anotacao atualizada', async () => {
    const service = makeService();
    service.atualizar.mockResolvedValueOnce(anotacao);
    const body = { conteudo: anotacao.conteudo };
    const res = makeRes();

    await new AnotacaoController(service).atualizar(
      { params: { id: '1' }, body } as unknown as Request,
      res,
    );

    expect(service.atualizar).toHaveBeenCalledWith(1, body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(anotacao);
  });

  it('DELETE deve retornar 204', async () => {
    const service = makeService();
    service.remover.mockResolvedValueOnce(undefined);
    const res = makeRes();

    await new AnotacaoController(service).remover(
      { params: { id: '1' } } as unknown as Request,
      res,
    );

    expect(service.remover).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deve repassar erro conhecido do service', async () => {
    const service = makeService();
    const erro = Object.assign(new Error('Aluno nao encontrado.'), { status: 404 });
    service.listarPorAluno.mockRejectedValueOnce(erro);
    const res = makeRes();

    await new AnotacaoController(service).listar(
      { params: { ra: '999' } } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Aluno nao encontrado.' });
  });

  it('deve ocultar erro interno inesperado', async () => {
    const service = makeService();
    service.criar.mockRejectedValueOnce(new Error('Erro no banco'));
    const res = makeRes();

    await new AnotacaoController(service).criar(
      { params: { ra: '101' }, body: {} } as unknown as Request,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao processar anotacao.' });
  });
});
