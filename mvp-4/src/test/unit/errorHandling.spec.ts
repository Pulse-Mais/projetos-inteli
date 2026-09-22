import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/AppError';
import { tratadorGlobalDeErros, rotaNaoEncontrada } from '../../middlewares/errorHandler';
import { validar, validarParamNumerico, exigirBody, Validadores } from '../../middlewares/validacao';
import { responderSucesso, responderErro } from '../../utils/resposta';

// App de teste isolado — não usa o pool real
function criarAppTeste() {
  const app = express();
  app.use(express.json());
  return app;
}

// ── AppError ──────────────────────────────────────────────────────────────────
describe('AppError', () => {
  it('deve criar erro com statusCode e mensagem corretos', () => {
    const err = new AppError('Não encontrado.', 404);
    expect(err.message).toBe('Não encontrado.');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('deve ter statusCode 400 por padrão', () => {
    const err = new AppError('Inválido.');
    expect(err.statusCode).toBe(400);
  });

  it('métodos estáticos devem retornar instâncias com o status correto', () => {
    expect(AppError.badRequest('x').statusCode).toBe(400);
    expect(AppError.notFound('x').statusCode).toBe(404);
    expect(AppError.internal('x').statusCode).toBe(500);
    expect(AppError.serviceUnavailable('x').statusCode).toBe(503);
  });

  it('instanceof AppError deve funcionar após new', () => {
    expect(new AppError('x') instanceof AppError).toBe(true);
  });
});

// ── tratadorGlobalDeErros ─────────────────────────────────────────────────────
describe('tratadorGlobalDeErros', () => {
  let app: express.Express;

  beforeEach(() => {
    app = criarAppTeste();
  });

  it('deve retornar resposta padronizada para AppError', async () => {
    app.get('/test', (_req, _res, next) => {
      next(new AppError('Recurso não encontrado.', 404));
    });
    app.use(tratadorGlobalDeErros);

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Recurso não encontrado.' });
  });

  it('deve retornar 500 genérico para erros inesperados', async () => {
    app.get('/test', (_req, _res, next) => {
      next(new Error('Erro de banco secreto xpto'));
    });
    app.use(tratadorGlobalDeErros);

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Ocorreu um erro interno. Tente novamente mais tarde.');
    // Mensagem original NÃO deve vazar para o usuário
    expect(res.body.error).not.toContain('xpto');
  });

  it('deve mapear erro de banco PostgreSQL 23505 para 409', async () => {
    app.get('/test', (_req, _res, next) => {
      const err: any = new Error('duplicate key');
      err.code = '23505';
      err.detail = 'Key (ra)=(1) already exists.';
      next(err);
    });
    app.use(tratadorGlobalDeErros);

    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('duplicado');
  });

  it('deve retornar resposta padronizada success:false sempre', async () => {
    app.get('/test', (_req, _res, next) => {
      next(new AppError('Erro qualquer.', 422));
    });
    app.use(tratadorGlobalDeErros);

    const res = await request(app).get('/test');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });
});

// ── rotaNaoEncontrada ─────────────────────────────────────────────────────────
describe('rotaNaoEncontrada', () => {
  it('deve retornar 404 com mensagem padronizada', async () => {
    const app = criarAppTeste();
    app.use(rotaNaoEncontrada);

    const res = await request(app).get('/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Rota não encontrada');
    expect(res.body.error).toContain('/rota-inexistente');
  });
});

// ── validarParamNumerico ──────────────────────────────────────────────────────
describe('validarParamNumerico', () => {
  let app: express.Express;

  beforeEach(() => {
    app = criarAppTeste();
    app.get('/alunos/:ra', validarParamNumerico('ra', 'RA'), (_req, res) => {
      res.json({ success: true, data: 'ok' });
    });
    app.use(tratadorGlobalDeErros);
  });

  it('deve passar para RA numérico válido', async () => {
    const res = await request(app).get('/alunos/42');
    expect(res.status).toBe(200);
  });

  it('deve retornar 400 para RA não numérico', async () => {
    const res = await request(app).get('/alunos/abc');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('RA');
  });

  it('deve retornar 400 para RA zero', async () => {
    const res = await request(app).get('/alunos/0');
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 para RA negativo', async () => {
    const res = await request(app).get('/alunos/-5');
    expect(res.status).toBe(400);
  });
});

// ── exigirBody ────────────────────────────────────────────────────────────────
describe('exigirBody', () => {
  let app: express.Express;

  beforeEach(() => {
    app = criarAppTeste();
    app.patch('/recurso', exigirBody, (_req, res) => {
      res.json({ success: true, data: 'ok' });
    });
    app.use(tratadorGlobalDeErros);
  });

  it('deve passar quando body tem campos', async () => {
    const res = await request(app).patch('/recurso').send({ campo: 'valor' });
    expect(res.status).toBe(200);
  });

  it('deve retornar 400 quando body está vazio', async () => {
    const res = await request(app).patch('/recurso').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── validar (esquema) ─────────────────────────────────────────────────────────
describe('validar (esquema)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = criarAppTeste();
    app.post(
      '/comunicado',
      validar({
        titulo: { validador: Validadores.textoNaoVazio('Título', 100), fonte: 'body' },
        conteudo: { validador: Validadores.textoNaoVazio('Conteúdo'), fonte: 'body' },
      }),
      (_req, res) => { res.json({ success: true, data: 'ok' }); },
    );
    app.use(tratadorGlobalDeErros);
  });

  it('deve passar com campos válidos', async () => {
    const res = await request(app)
      .post('/comunicado')
      .send({ titulo: 'Aviso Geral', conteudo: 'Texto do aviso.' });
    expect(res.status).toBe(200);
  });

  it('deve retornar 400 quando campo obrigatório está ausente', async () => {
    const res = await request(app).post('/comunicado').send({ titulo: 'Só título' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    // O middleware usa o nome técnico do campo (chave do esquema)
    expect(res.body.error).toContain('conteudo');
  });

  it('deve retornar 400 quando título excede tamanho máximo', async () => {
    const res = await request(app)
      .post('/comunicado')
      .send({ titulo: 'x'.repeat(101), conteudo: 'ok' });
    expect(res.status).toBe(400);
  });
});

// ── Validadores individuais ───────────────────────────────────────────────────
describe('Validadores', () => {
  it('numeroPositivo aceita inteiros positivos', () => {
    expect(Validadores.numeroPositivo('X')(5)).toBeNull();
    expect(Validadores.numeroPositivo('X')(0)).not.toBeNull();
    expect(Validadores.numeroPositivo('X')(-1)).not.toBeNull();
    expect(Validadores.numeroPositivo('X')('abc')).not.toBeNull();
  });

  it('email valida formato', () => {
    expect(Validadores.email('E')('a@b.com')).toBeNull();
    expect(Validadores.email('E')('invalido')).not.toBeNull();
  });

  it('data valida formato YYYY-MM-DD', () => {
    expect(Validadores.data('D')('2024-01-15')).toBeNull();
    expect(Validadores.data('D')('15/01/2024')).not.toBeNull();
    expect(Validadores.data('D')('2024-13-01')).not.toBeNull();
  });

  it('umaOpcao valida conjunto fixo', () => {
    const v = Validadores.umaOpcao('Status', ['ativo', 'inativo']);
    expect(v('ativo')).toBeNull();
    expect(v('outro')).not.toBeNull();
  });
});

// ── responderSucesso / responderErro ──────────────────────────────────────────
describe('utilitários de resposta', () => {
  it('responderSucesso deve formatar success:true com data', async () => {
    const app = criarAppTeste();
    app.get('/ok', (_req, res) => {
      responderSucesso(res, { id: 1 });
    });

    const res = await request(app).get('/ok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: 1 } });
  });

  it('responderSucesso aceita statusCode e message customizados', async () => {
    const app = criarAppTeste();
    app.post('/criar', (_req, res) => {
      responderSucesso(res, { id: 2 }, 201, 'Criado com sucesso.');
    });

    const res = await request(app).post('/criar');
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Criado com sucesso.');
  });

  it('responderErro deve formatar success:false com error', async () => {
    const app = criarAppTeste();
    app.get('/err', (_req, res) => {
      responderErro(res, 'Algo deu errado.', 422);
    });

    const res = await request(app).get('/err');
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ success: false, error: 'Algo deu errado.' });
  });
});
