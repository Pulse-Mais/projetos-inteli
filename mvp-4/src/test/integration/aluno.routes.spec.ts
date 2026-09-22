import request from 'supertest';
import * as fs from 'fs/promises';
import pool from '../../database/connection';
import app from '../../app';
import { Aluno } from '../../database/models/aluno.model';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('AlunoRoutes', () => {
  const queryMock = pool.query as jest.Mock;

  const aluno: Aluno = {
    ra: 1,
    nome: 'Carlos Sales',
    cpf: '12345678900',
    foto: 'foto.png',
    data_nasc: '2000-01-01',
    id_turma: 1,
    status: 'ativo',
    genero: 'masculino',
    categoria: 'Capacitado',
    email_primario: 'carlos@email.com',
    tel_primario: '11999999999',
    cep: '00000000',
    endereco: 'Rua Teste',
    renda_familiar: '1000',
  };

  beforeEach(() => {
    queryMock.mockReset();
    (fs.mkdir as jest.Mock).mockReset().mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockReset().mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockReset().mockResolvedValue(undefined);
    jest.restoreAllMocks();
  });

  it('GET /alunos/:ra deve retornar aluno encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [aluno] });

    const response = await request(app).get('/alunos/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(aluno);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM aluno'),
      [1],
    );
  });

  it('GET /alunos/:ra deve retornar 404 quando aluno nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/alunos/99');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Aluno nao encontrado.' });
  });

  it('GET /alunos/:ra deve retornar 400 quando RA for invalido', async () => {
    const response = await request(app).get('/alunos/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, error: 'RA inválido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('PATCH /alunos/:ra deve atualizar aluno existente', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [aluno] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/alunos/1')
      .send({ email_primario: 'novo@email.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Dados atualizados com sucesso.' });
    expect(queryMock).toHaveBeenLastCalledWith(
      'UPDATE aluno SET email_primario = $1 WHERE ra = $2',
      ['novo@email.com', 1],
    );
  });

  it('PATCH /alunos/:ra deve atualizar categoria do aluno', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [aluno] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/alunos/1')
      .send({ categoria: 'Empregado' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Dados atualizados com sucesso.' });
    expect(queryMock).toHaveBeenLastCalledWith(
      'UPDATE aluno SET categoria = $1 WHERE ra = $2',
      ['Empregado', 1],
    );
  });

  it('PATCH /alunos/:ra deve persistir foto valida', async () => {
    const foto = 'data:image/png;base64,aGVsbG8=';
    jest.spyOn(Date, 'now').mockReturnValue(1719230000000);

    queryMock
      .mockResolvedValueOnce({ rows: [aluno] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/alunos/1')
      .send({ foto });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Dados atualizados com sucesso.' });
    expect(queryMock).toHaveBeenLastCalledWith(
      'UPDATE aluno SET fotos = $1 WHERE ra = $2',
      ['/aluno/uploads/1-1719230000000.png', 1],
    );
  });

  it('PATCH /alunos/:ra deve rejeitar foto com formato invalido', async () => {
    queryMock.mockResolvedValueOnce({ rows: [aluno] });

    const response = await request(app)
      .patch('/alunos/1')
      .send({ foto: 'data:text/plain;base64,Zm9v' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Formato de foto invalido. Envie PNG, JPG ou WEBP.' });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('PATCH /alunos/:ra deve retornar 400 quando body vier vazio', async () => {
    const response = await request(app)
      .patch('/alunos/1')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, error: 'O corpo da requisição não pode estar vazio.' });
    expect(queryMock).not.toHaveBeenCalled();
  });
});
