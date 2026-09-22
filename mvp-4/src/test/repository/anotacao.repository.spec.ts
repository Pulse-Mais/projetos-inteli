import pool from '../../database/connection';
import { AnotacaoRepository } from '../../repositories/anotacao.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('AnotacaoRepository', () => {
  const queryMock = pool.query as jest.Mock;
  const repository = new AnotacaoRepository();
  const anotacao = {
    id_anotacoes: 1,
    id_aluno: 101,
    nome_autor: 'Gabriela Ferreira - Psicologa',
    data: '2026-06-11',
    conteudo: 'Aluno apresentou evolucao.',
  };

  beforeEach(() => queryMock.mockReset());

  it('deve verificar se aluno existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    await expect(repository.alunoExiste(101)).resolves.toBe(true);
    expect(queryMock).toHaveBeenCalledWith('SELECT 1 FROM aluno WHERE ra = $1', [101]);
  });

  it('deve listar anotacoes do aluno', async () => {
    queryMock.mockResolvedValueOnce({ rows: [anotacao] });

    await expect(repository.listarPorAluno(101)).resolves.toEqual([anotacao]);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM anotacoes'),
      [101],
    );
  });

  it('deve criar anotacao usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [anotacao] });

    await expect(repository.criar(101, {
      nome_autor: anotacao.nome_autor,
      data: anotacao.data,
      conteudo: anotacao.conteudo,
    })).resolves.toEqual(anotacao);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO anotacoes'),
      [101, anotacao.nome_autor, anotacao.data, anotacao.conteudo],
    );
  });

  it('deve atualizar anotacao usando campos opcionais', async () => {
    queryMock.mockResolvedValueOnce({ rows: [anotacao] });

    await expect(repository.atualizar(1, {
      conteudo: anotacao.conteudo,
    })).resolves.toEqual(anotacao);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE anotacoes'),
      [null, null, anotacao.conteudo, 1],
    );
  });

  it('deve retornar null ao atualizar anotacao inexistente', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await expect(repository.atualizar(99, { conteudo: 'Novo' })).resolves.toBeNull();
  });

  it('deve remover anotacao existente', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    await expect(repository.remover(1)).resolves.toBe(true);
    expect(queryMock).toHaveBeenCalledWith(
      'DELETE FROM anotacoes WHERE id_anotacoes = $1',
      [1],
    );
  });
});
