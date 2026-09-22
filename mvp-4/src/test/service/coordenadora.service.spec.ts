import { AlunoCoordenadora, Coordenadora, Relatorio } from '../../database/models/coordenadora.model';
import { CoordenadoraRepository } from '../../repositories/coordenadora.repository';
import { CoordenadoraService } from '../../services/coordenadora.service';

describe('CoordenadoraService', () => {
  const makeRepository = () =>
    ({
      buscarPorRm: jest.fn(),
      listarAlunos: jest.fn(),
      registrarFrequencia: jest.fn(),
      atualizarFrequencia: jest.fn(),
      registrarObservacao: jest.fn(),
      registrarEvento: jest.fn(),
      listarRelatorios: jest.fn(),
      filtrarAlunos: jest.fn(),
    } as unknown as jest.Mocked<CoordenadoraRepository>);

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

  it('deve buscar coordenadora por RM', async () => {
    const repository = makeRepository();
    repository.buscarPorRm.mockResolvedValueOnce(coordenadora);
    const service = new CoordenadoraService(repository);

    const resultado = await service.buscarPorRm(1011);

    expect(repository.buscarPorRm).toHaveBeenCalledWith(1011);
    expect(resultado).toEqual(coordenadora);
  });

  it('deve retornar null quando coordenadora nao for encontrada', async () => {
    const repository = makeRepository();
    repository.buscarPorRm.mockResolvedValueOnce(null);
    const service = new CoordenadoraService(repository);

    const resultado = await service.buscarPorRm(9999);

    expect(repository.buscarPorRm).toHaveBeenCalledWith(9999);
    expect(resultado).toBeNull();
  });

  it('deve listar alunos vinculados a coordenadora', async () => {
    const repository = makeRepository();
    repository.listarAlunos.mockResolvedValueOnce(alunos);
    const service = new CoordenadoraService(repository);

    const resultado = await service.listarAlunos(1011);

    expect(repository.listarAlunos).toHaveBeenCalledWith(1011);
    expect(resultado).toEqual(alunos);
  });

  it('deve retornar lista vazia quando nenhum aluno for encontrado', async () => {
    const repository = makeRepository();
    repository.listarAlunos.mockResolvedValueOnce([]);
    const service = new CoordenadoraService(repository);

    const resultado = await service.listarAlunos(1011);

    expect(repository.listarAlunos).toHaveBeenCalledWith(1011);
    expect(resultado).toEqual([]);
  });

  // GET /coordenadora/:rm/alunos/:ra/relatorios

  describe('GET /coordenadora/:rm/alunos/:ra/relatorios', () => {
    const relatorios: Relatorio[] = [
      {
        id_relatorio: 1,
        info_simplificada: 'Aluno demonstrou evolução significativa.',
        observacoes: 'Participou ativamente das atividades em grupo.',
        data: '2026-05-25',
        id_aluno: 101,
        id_psicologo: 2,
      },
    ];

    it('deve listar relatorios do aluno vinculado a coordenadora', async () => {
      const repository = makeRepository();
      (repository as any).listarRelatorios.mockResolvedValueOnce(relatorios);
      const service = new CoordenadoraService(repository);

      const resultado = await (service as any).listarRelatorios(1011, 101);

      expect((repository as any).listarRelatorios).toHaveBeenCalledWith(1011, 101);
      expect(resultado).toEqual(relatorios);
    });

    it('deve retornar lista vazia quando nenhum relatorio for encontrado', async () => {
      const repository = makeRepository();
      (repository as any).listarRelatorios.mockResolvedValueOnce([]);
      const service = new CoordenadoraService(repository);

      const resultado = await (service as any).listarRelatorios(1011, 101);

      expect((repository as any).listarRelatorios).toHaveBeenCalledWith(1011, 101);
      expect(resultado).toEqual([]);
    });

    it('deve propagar erro quando repository falhar ao listar relatorios', async () => {
      const repository = makeRepository();
      (repository as any).listarRelatorios.mockRejectedValueOnce(new Error('Erro no banco'));
      const service = new CoordenadoraService(repository);

      await expect((service as any).listarRelatorios(1011, 101)).rejects.toThrow('Erro no banco');
      expect((repository as any).listarRelatorios).toHaveBeenCalledWith(1011, 101);
    });
  });

  // GET /coordenadora/:rm/alunos/filtros - RF015

  describe('GET /coordenadora/:rm/alunos/filtros', () => {
    const filtros = {
      idade_min: 18,
      idade_max: 25,
      empregabilidade: 'Empregado',
      id_turma: 1,
      localizacao: 'Paraisopolis',
      eventos_min: 2,
      eventos_max: 10,
      genero: 'M',
    };

    const alunosFiltrados: AlunoCoordenadora[] = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        status: 'Capacitado',
        nivel_formacao: 'Ensino Medio',
        id_turma: 1,
        frequencia: true,
      },
    ];

    it('deve filtrar alunos vinculados a coordenadora com filtros informados', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockResolvedValueOnce(alunosFiltrados);
      const service = new CoordenadoraService(repository);

      const resultado = await (service as any).filtrarAlunos(1011, filtros);

      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1011, filtros);
      expect(resultado).toEqual(alunosFiltrados);
    });

    it('deve retornar lista vazia quando nenhum aluno corresponder aos filtros', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockResolvedValueOnce([]);
      const service = new CoordenadoraService(repository);

      const resultado = await (service as any).filtrarAlunos(1011, filtros);

      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1011, filtros);
      expect(resultado).toEqual([]);
    });

    it('deve propagar erro quando repository falhar ao filtrar alunos', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));
      const service = new CoordenadoraService(repository);

      await expect((service as any).filtrarAlunos(1011, filtros)).rejects.toThrow('Erro no banco');
      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1011, filtros);
    });
  });
});