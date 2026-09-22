import request from 'supertest';
import app from '../../app';

describe('autenticacao e isolamento por identidade', () => {
  it('autentica por RA e permite consultar somente o proprio aluno', async () => {
    const agente = request.agent(app);
    const login = await agente.post('/auth/login').send({
      perfil: 'aluno',
      identificador: '101',
      senha: 'Nexus@101',
    });

    expect(login.status).toBe(200);
    expect(login.body.usuario).toMatchObject({ id: 101, perfil: 'aluno' });
    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');

    expect((await agente.get('/auth/me')).status).toBe(200);
    expect((await agente.get('/alunos/101')).status).toBe(200);
    expect((await agente.get('/alunos/102')).status).toBe(403);
  });

  it('rejeita senha incorreta', async () => {
    const resposta = await request(app).post('/auth/login').send({
      perfil: 'aluno',
      identificador: '101',
      senha: 'incorreta',
    });

    expect(resposta.status).toBe(401);
  });
});
