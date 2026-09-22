import { AnotacaoRepository } from '../../repositories/anotacao.repository';
import { AnotacaoService } from '../../services/anotacao.service';

describe('AnotacaoService', () => {
  const repository = {
    alunoExiste: jest.fn(),
    listarPorAluno: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn(),
  } as unknown as jest.Mocked<AnotacaoRepository>;

  const service = new AnotacaoService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria anotacao para aluno existente', async () => {
    const anotacao = {
      id_anotacoes: 1,
      id_aluno: 101,
      nome_autor: 'Gabriela Ferreira - Psicologa',
      data: '2026-06-11',
      conteudo: 'Aluno participou do acompanhamento.',
    };
    repository.alunoExiste.mockResolvedValue(true);
    repository.criar.mockResolvedValue(anotacao);

    await expect(service.criar(101, {
      nome_autor: anotacao.nome_autor,
      conteudo: anotacao.conteudo,
    })).resolves.toEqual(anotacao);
  });

  it('rejeita anotacao quando aluno nao existe', async () => {
    repository.alunoExiste.mockResolvedValue(false);

    await expect(service.criar(999, {
      nome_autor: 'Rafael Santana - Mentor',
      conteudo: 'Anotacao da equipe.',
    })).rejects.toMatchObject({
      message: 'Aluno nao encontrado.',
      status: 404,
    });
  });

  it('rejeita conteudo vazio', async () => {
    await expect(service.criar(101, {
      nome_autor: 'Rafael Santana - Mentor',
      conteudo: '',
    })).rejects.toMatchObject({
      message: 'conteudo invalido.',
      status: 400,
    });
  });

  it('remove anotacao existente', async () => {
    repository.remover.mockResolvedValue(true);

    await expect(service.remover(1)).resolves.toBeUndefined();
    expect(repository.remover).toHaveBeenCalledWith(1);
  });

  it('lista anotacoes de aluno existente', async () => {
    repository.alunoExiste.mockResolvedValueOnce(true);
    repository.listarPorAluno.mockResolvedValueOnce([]);

    await expect(service.listarPorAluno(101)).resolves.toEqual([]);
    expect(repository.listarPorAluno).toHaveBeenCalledWith(101);
  });

  it('atualiza anotacao existente', async () => {
    const anotacao = {
      id_anotacoes: 1,
      id_aluno: 101,
      nome_autor: 'Rafael Santana - Mentor',
      data: '2026-06-11',
      conteudo: 'Conteudo atualizado.',
    };
    repository.atualizar.mockResolvedValueOnce(anotacao);

    await expect(service.atualizar(1, { conteudo: anotacao.conteudo })).resolves.toEqual(anotacao);
  });

  it('rejeita atualizacao sem campos', async () => {
    await expect(service.atualizar(1, {})).rejects.toMatchObject({
      message: 'Informe ao menos um campo para atualizar.',
      status: 400,
    });
  });

  it('retorna 404 ao atualizar anotacao inexistente', async () => {
    repository.atualizar.mockResolvedValueOnce(null);
    await expect(service.atualizar(99, { conteudo: 'Novo' })).rejects.toMatchObject({
      message: 'Anotacao nao encontrada.',
      status: 404,
    });
  });

  it('retorna 404 ao remover anotacao inexistente', async () => {
    repository.remover.mockResolvedValueOnce(false);
    await expect(service.remover(99)).rejects.toMatchObject({
      message: 'Anotacao nao encontrada.',
      status: 404,
    });
  });
});
