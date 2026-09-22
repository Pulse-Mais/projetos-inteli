import pool from '../../database/connection';
import { AlunoCoordenadora, Coordenadora } from '../../database/models/coordenadora.model';
import { CoordenadoraRepository } from '../../repositories/coordenadora.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('CoordenadoraRepository', () => {
  const queryMock = pool.query as jest.Mock;

  const coordenadora: Coordenadora = {
    rm: 1011,
    nome: 'Denise Soares',
    cargo: 'Coordenadora Pedagogica',
    setor: 'Gestao de pessoas',
    email: 'denise.soarespulsemais@gmail.com',
  };

  const alunos: AlunoCoordenadora[] = [
    {
      ra: 1,
      nome: 'Carlos Sales',
      status: 'Capacitado',
      nivel_formacao: 'Ensino Medio',
      id_turma: 1,
      frequencia: true,
    },
    {
      ra: 2,
      nome: 'Ana Lima',
      status: 'Em andamento',
      nivel_formacao: 'Ensino Medio',
      id_turma: 1,
      frequencia: false,
    },
  ];

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('deve buscar coordenadora por RM usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [coordenadora] });
    const repository = new CoordenadoraRepository();

    const resultado = await repository.buscarPorRm(1011);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM coordenador'),
      [1011],
    );
    expect(resultado).toEqual(coordenadora);
  });

  it('deve retornar null quando nenhuma coordenadora for encontrada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new CoordenadoraRepository();

    const resultado = await repository.buscarPorRm(9999);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM coordenador'),
      [9999],
    );
    expect(resultado).toBeNull();
  });

  it('deve listar alunos vinculados a coordenadora usando RM como parametro', async () => {
    queryMock.mockResolvedValueOnce({ rows: alunos });
    const repository = new CoordenadoraRepository();

    const resultado = await repository.listarAlunos(1011);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE coordenador.rm = $1'),
      [1011],
    );
    expect(resultado).toEqual(alunos);
  });

  it('deve retornar lista vazia quando nenhum aluno for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new CoordenadoraRepository();

    const resultado = await repository.listarAlunos(1011);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE coordenador.rm = $1'),
      [1011],
    );
    expect(resultado).toEqual([]);
  });

  it('deve registrar frequencia usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new CoordenadoraRepository();
    const dados = {
      id_aula: 10,
      data: '2026-05-25',
      frequencia: true,
    };

    await repository.registrarFrequencia(1011, 1, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO frequenta'),
      [
        1,
        10,
        '2026-05-25',
        true,
      ],
    );
  });

  it('deve atualizar frequencia usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new CoordenadoraRepository();
    const dados = {
      frequencia: false,
    };

    const resultado = await repository.atualizarFrequencia(1011, 1, 10, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE frequenta'),
      [
        false,
        1,
        10,
        1011,
      ],
    );
    expect(resultado).toBe(true);
  });

  it('deve retornar false quando nenhuma frequencia for atualizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    const repository = new CoordenadoraRepository();
    const dados = {
      frequencia: false,
    };

    const resultado = await repository.atualizarFrequencia(1011, 1, 10, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE frequenta'),
      [
        false,
        1,
        10,
        1011,
      ],
    );
    expect(resultado).toBe(false);
  });

  it('deve registrar evento usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new CoordenadoraRepository();
    const dados = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
      descricao: 'Comunicado sobre empregabilidade.',
    };

    await (repository as any).registrarEvento(1011, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO comunicado'),
      [
        'Workshop de Empregabilidade',
        'Sede Central',
        '2026-06-10',
        'Alto Planejado',
        'Comunicado sobre empregabilidade.',
        1011,
      ],
    );
  });

  it('deve propagar erro quando falhar ao registrar evento', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));
    const repository = new CoordenadoraRepository();
    const dados = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
    };

    await expect(
      (repository as any).registrarEvento(1011, dados),
    ).rejects.toThrow('Erro no banco');
  });

  it('deve registrar observacao usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new CoordenadoraRepository();
    const dados = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };

    await (repository as any).registrarObservacao(1011, 1, dados);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        1,
        'Aluno demonstrou evolução significativa.',
        'Participou ativamente das atividades em grupo.',
        '2026-05-25',
        1011,
      ],
    );
  });

  it('deve propagar erro quando falhar ao registrar observacao', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));
    const repository = new CoordenadoraRepository();
    const dados = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };

    await expect(
      (repository as any).registrarObservacao(1011, 1, dados),
    ).rejects.toThrow('Erro no banco');
  });

  // GET /coordenadora/:rm/alunos/:ra/relatorios
  it('deve listar relatorios do aluno usando rm e ra como parametros', async () => {
    const relatorios = [
      {
        id_relatorio: 1,
        info_simplificada: 'Aluno demonstrou evolução significativa.',
        observacoes: 'Participou ativamente das atividades em grupo.',
        data: '2026-05-25',
        id_aluno: 101,
        id_psicologo: 2,
      },
    ];
    queryMock.mockResolvedValueOnce({ rows: relatorios });
    const repository = new CoordenadoraRepository();

    const resultado = await (repository as any).listarRelatorios(1011, 101);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1011, 101],
    );
    expect(resultado).toEqual(relatorios);
  });

  it('deve retornar lista vazia quando nenhum relatorio for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new CoordenadoraRepository();

    const resultado = await (repository as any).listarRelatorios(1011, 101);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1011, 101],
    );
    expect(resultado).toEqual([]);
  });

  it('deve propagar erro quando falhar ao listar relatorios', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));
    const repository = new CoordenadoraRepository();

    await expect(
      (repository as any).listarRelatorios(1011, 101),
    ).rejects.toThrow('Erro no banco');
  });

  // NOVO: GET /coordenadora/:rm/alunos/filtros

  it('deve listar alunos filtrados vinculados a coordenadora usando RM e filtros', async () => {
    queryMock.mockResolvedValueOnce({ rows: [alunos[0]] });
    const repository = new CoordenadoraRepository();
    
    const filtros = {
      status: 'Capacitado',
      id_turma: 1,
    };

    const resultado = await (repository as any).listarAlunosComFiltros(1011, filtros);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE coordenador.rm = $1'),
      expect.arrayContaining([1011, 'Capacitado', 1]),
    );
    expect(resultado).toEqual([alunos[0]]);
  });

  it('deve retornar lista vazia quando nenhum aluno corresponder aos filtros', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new CoordenadoraRepository();
    
    const filtros = {
      status: 'Inexistente',
    };

    const resultado = await (repository as any).listarAlunosComFiltros(1011, filtros);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE coordenador.rm = $1'),
      expect.arrayContaining([1011, 'Inexistente']),
    );
    expect(resultado).toEqual([]);
  });

  it('deve aplicar filtros avancados na listagem de alunos', async () => {
    queryMock.mockResolvedValueOnce({ rows: [alunos[0]] });
    const repository = new CoordenadoraRepository();

    const filtros = {
      idade_min: 18,
      idade_max: 24,
      empregabilidade: 'empregado',
      eventos_min: 1,
      eventos_max: 4,
      genero: 'feminino',
    };

    const resultado = await (repository as any).listarAlunosComFiltros(1011, filtros);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('EXTRACT(YEAR FROM AGE(CURRENT_DATE, aluno.data_nasc)) >='),
      expect.arrayContaining([1011, 18, 24, 1, 4, 'feminino']),
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM empregabilidade'),
      expect.any(Array),
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM participa'),
      expect.any(Array),
    );
    expect(resultado).toEqual([alunos[0]]);
  });

  it('deve propagar erro quando falhar ao listar alunos com filtros', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro ao aplicar filtros'));
    const repository = new CoordenadoraRepository();

    await expect(
      (repository as any).listarAlunosComFiltros(1011, { status: 'Capacitado' }),
    ).rejects.toThrow('Erro ao aplicar filtros');
  });
});
