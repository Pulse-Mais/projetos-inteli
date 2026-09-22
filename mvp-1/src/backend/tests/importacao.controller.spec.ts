jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/alunoRepository');

import request from 'supertest';
import { app } from '../app';
import path from 'path';
import fs from 'fs';

const usuarioRepo = require('../repositories/usuarioRepository') as jest.Mocked<
  typeof import('../repositories/usuarioRepository')
>;
const alunoRepo = require('../repositories/alunoRepository') as jest.Mocked<
  typeof import('../repositories/alunoRepository')
>;

const randomCpf = '12345678901';
const csvValido = `nome,email,senha,cpf\nImportado Teste,importado@email.com,123456,${randomCpf}`;

const csvDuplicado = `nome,email,senha,cpf\nPedro A,pedro.a@email.com,123456,11122233344\nPedro B,pedro.b@email.com,123456,11122233344`;

const csvPath = path.join(__dirname, 'temp_valido.csv');
const csvDupPath = path.join(__dirname, 'temp_dup.csv');
const txtPath = path.join(__dirname, 'temp_invalido.txt');

beforeAll(() => {
  fs.writeFileSync(csvPath, csvValido);
  fs.writeFileSync(csvDupPath, csvDuplicado);
  fs.writeFileSync(txtPath, 'conteudo invalido');
});

afterAll(() => {
  try { fs.unlinkSync(csvPath); } catch {}
  try { fs.unlinkSync(csvDupPath); } catch {}
  try { fs.unlinkSync(txtPath); } catch {}
});

beforeEach(() => jest.clearAllMocks());

describe('POST /importacao/alunos', () => {
  it('retorna 400 para arquivo .txt (RN08)', async () => {
    const res = await request(app)
      .post('/importacao/alunos')
      .attach('arquivo', txtPath);
    expect(res.status).toBe(400);
  });

  it('retorna 200 para CSV válido sem conflitos', async () => {
    usuarioRepo.findByCpf.mockResolvedValue(null);
    usuarioRepo.findByEmail.mockResolvedValue(null);
    usuarioRepo.create.mockResolvedValue({ id_usuario: 10, nome: 'Importado Teste', email: 'importado@email.com', cpf: randomCpf, senha: '123456' });
    alunoRepo.createForExistingUser.mockResolvedValue({ id_usuario: 10, ativo: true } as any);

    const res = await request(app)
      .post('/importacao/alunos')
      .attach('arquivo', csvPath);
    expect(res.status).toBe(200);
    expect(res.body.importados).toBe(1);
  });

  it('retorna 207 para CSV com CPF duplicado', async () => {
    // First row: CPF already exists → conflict
    usuarioRepo.findByCpf
      .mockResolvedValueOnce({ id_usuario: 99 } as any)  // first row: CPF exists
      .mockResolvedValueOnce({ id_usuario: 99 } as any); // second row: same CPF also exists
    usuarioRepo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/importacao/alunos')
      .attach('arquivo', csvDupPath);
    expect(res.status).toBe(207);
    expect(res.body.conflitos.length).toBeGreaterThan(0);
    expect(res.body.conflitos[0].cpf).toBe('11122233344');
  });
});
