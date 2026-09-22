import pool from '../../database/connection';
import { Psicologo } from '../../database/models/psicologo.model';
import { PsicologoRepository } from '../../repositories/psicologo.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('PsicologoRepository', () => {
  const queryMock = pool.query as jest.Mock;

  const psicologo: Psicologo = {
    rm: 1,
    nome: 'Mariana Rodrigues',
    cargo: 'Psicologa',
    email: 'mariana.rodriguespulsemais@gmail.com',
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('deve buscar psicologa por RM usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [psicologo] });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarRmPsi(1);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM psicologo WHERE rm = $1'),
      [1],
    );
    expect(resultado).toEqual(psicologo);
  });

  it('deve retornar null quando nenhuma psicologa for encontrada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarRmPsi(99);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM psicologo WHERE rm = $1'),
      [99],
    );
    expect(resultado).toBeNull();
  });

  it('deve buscar alunos atendidos com filtros parametrizados', async () => {
    const alunos = [
      {
        ra: 2,
        nome: 'Ana Lima',
        status: true,
        id_turma: 1,
      },
    ];
    queryMock.mockResolvedValueOnce({ rows: alunos });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarAlunosPorRm(1, {
      busca: 'Ana',
      id_turma: 1,
      status: 'ACTIVE',
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('aluno.nome ILIKE $1'),
      ['%Ana%', 1],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('aluno.id_turma = $2'),
      ['%Ana%', 1],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(aluno.status::text) NOT IN'),
      ['%Ana%', 1],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.not.stringContaining('relatorio.id_psicologo'),
      ['%Ana%', 1],
    );
    expect(resultado).toEqual(alunos);
  });

  it('deve listar todos os alunos por padrao sem restringir pela psicologa', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarAlunosPorRm(1);

    expect(queryMock).toHaveBeenCalledWith(
      expect.not.stringContaining('LOWER(aluno.status::text)'),
      [],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.not.stringContaining('INNER JOIN relatorio'),
      [],
    );
    expect(resultado).toEqual([]);
  });

  it('deve remover filtro de status quando status ALL for informado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new PsicologoRepository();

    await repository.buscarAlunosPorRm(1, { status: 'ALL' });

    expect(queryMock).toHaveBeenCalledWith(
      expect.not.stringContaining('LOWER(aluno.status::text)'),
      [],
    );
  });

  it('deve registrar prontuario usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new PsicologoRepository();
    const dados = {
      info_simplificada: 'Aluno apresenta sinais de ansiedade.',
      observacoes: 'Recomendado acompanhamento semanal.',
      data: '2026-05-25',
    };

    await repository.registrarProntuario(1, 1, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        'Aluno apresenta sinais de ansiedade.',
        'Recomendado acompanhamento semanal.',
        '2026-05-25',
        1,
        1,
      ],
    );
  });

  it('deve registrar prontuario com observacoes vazias quando campo nao for enviado', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new PsicologoRepository();
    const dados = {
      info_simplificada: 'Aluno apresenta sinais de ansiedade.',
      data: '2026-05-25',
    };

    await repository.registrarProntuario(1, 1, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        'Aluno apresenta sinais de ansiedade.',
        '',
        '2026-05-25',
        1,
        1,
      ],
    );
  });
  it('deve buscar prontuarios do aluno usando query parametrizada', async () => {
    const prontuarios = [
      {
        id_relatorio: 1,
        info_simplificada: 'Aluno apresenta sinais de ansiedade.',
        observacoes: 'Recomendado acompanhamento semanal.',
        data: '2026-05-25',
      },
      {
        id_relatorio: 2,
        info_simplificada: 'Melhora observada após duas semanas.',
        observacoes: 'Continuar acompanhamento.',
        data: '2026-06-01',
      },
    ];
    queryMock.mockResolvedValueOnce({ rows: prontuarios });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarProntuarios(1, 1);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1, 1],
    );
    expect(resultado).toEqual(prontuarios);
  });

  it('deve retornar lista vazia quando nenhum prontuario for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new PsicologoRepository();

    const resultado = await repository.buscarProntuarios(1, 99);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1, 99],
    );
    expect(resultado).toEqual([]);
  });

  it('deve atualizar prontuario usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new PsicologoRepository();
    const dados = {
      info_simplificada: 'Aluno apresenta melhora significativa.',
      observacoes: 'Reduzir frequencia de sessoes.',
    };

    const resultado = await repository.atualizarProntuario(1, 1, 1, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE relatorio SET info_simplificada = $1, observacoes = $2'),
      [
        'Aluno apresenta melhora significativa.',
        'Reduzir frequencia de sessoes.',
        1,
        1,
        1,
      ],
    );
    expect(resultado).toBe(true);
  });

  it('deve retornar false quando nenhum prontuario for atualizado', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    const repository = new PsicologoRepository();
    const dados = {
      info_simplificada: 'Aluno apresenta melhora significativa.',
    };

    const resultado = await repository.atualizarProntuario(1, 1, 99, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE relatorio SET info_simplificada = $1'),
      [
        'Aluno apresenta melhora significativa.',
        1,
        1,
        99,
      ],
    );
    expect(resultado).toBe(false);
  });

  it('nao deve executar query quando nenhum campo for enviado para atualizar prontuario', async () => {
    const repository = new PsicologoRepository();

    const resultado = await repository.atualizarProntuario(1, 1, 1, {});

    expect(queryMock).not.toHaveBeenCalled();
    expect(resultado).toBe(false);
  });

  it('deve atualizar status do atendimento usando query parametrizada', async () => {
    const aluno = {
      ra: 1,
      nome: 'Ana Lima',
      status: false,
      id_turma: 1,
    };
    queryMock.mockResolvedValueOnce({ rows: [aluno] });
    const repository = new PsicologoRepository();

    const resultado = await repository.atualizarStatusAtendimento(1, 1, false);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE aluno'),
      [1, 'false'],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.not.stringContaining('relatorio.id_psicologo'),
      [1, 'false'],
    );
    expect(resultado).toEqual(aluno);
  });

  it('deve retornar null quando nenhum status de atendimento for atualizado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new PsicologoRepository();

    const resultado = await repository.atualizarStatusAtendimento(1, 99, true);

    expect(resultado).toBeNull();
  });
});
