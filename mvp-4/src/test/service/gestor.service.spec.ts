import { AlunoDetalhadoGestor, AlunoGestor, Gestor } from '../../database/models/gestor.model';
import { GestorRepository } from '../../repositories/gestor.repository';
import { GestorService } from '../../services/gestor.service';

describe('GestorService', () => {
  const gestor: Gestor = {
    rm: 1010,
    nome: 'Eduardo Freitas',
    email: 'eduardo.freitaspulsemais@gmail.com',
  };

  const alunos: AlunoGestor[] = [
    {
      ra: 1,
      nome: 'Carlos Sales',
      status: 'Capacitado',
      nivel_formacao: 'Ensino Medio',
      idTurma: 1,
      frequencia: true,
      empregabilidade: {
        empresa: 'Tech Corp',
        cargo: 'Desenvolvedor',
        faixa_salarial: 'R$: 3000,00',
      },
    },
  ];

  const alunoDetalhado: AlunoDetalhadoGestor = {
    ra: 1,
    nome: 'Carlos Sales',
    foto: 'assets/fotoPerfilCarlosSales.png',
    idTurma: 1,
    status: 'Capacitado',
    genero: 'Masculino',
    email_primario: 'Carlos.sales@gmail.com',
    email_secundario: 'sales.carlos@gmail.com',
    tel_primario: '9494-9494',
    tel_secundario: '9272-4002',
    cep: '00893-000',
    endereco: 'Rua Eusebio Mattoso, 1',
    renda_familiar: 'R$: 1610,00',
    empregabilidade: {
      empresa: 'Tech Corp',
      cargo: 'Desenvolvedor',
      faixa_salarial: 'R$: 3000,00',
      nivel_formacao: 'Ensino Superior',
    },
  };

  const makeRepository = () =>
    ({
      buscarPorRm: jest.fn(),
      listarAlunos: jest.fn(),
      buscarAlunoPorRa: jest.fn(),
      enviarComunicado: jest.fn(),
      importarHistoricoCsv: jest.fn(),
      filtrarAlunos: jest.fn(),
    } as unknown as jest.Mocked<GestorRepository>);

  it('deve buscar gestor por RM', async () => {
    const repository = makeRepository();
    repository.buscarPorRm.mockResolvedValueOnce(gestor);
    const service = new GestorService(repository);

    const resultado = await service.buscarPorRm(1010);

    expect(repository.buscarPorRm).toHaveBeenCalledWith(1010);
    expect(resultado).toEqual(gestor);
  });

  it('deve retornar null quando gestor nao for encontrado', async () => {
    const repository = makeRepository();
    repository.buscarPorRm.mockResolvedValueOnce(null);
    const service = new GestorService(repository);

    const resultado = await service.buscarPorRm(9999);

    expect(repository.buscarPorRm).toHaveBeenCalledWith(9999);
    expect(resultado).toBeNull();
  });

  it('deve listar alunos vinculados ao gestor', async () => {
    const repository = makeRepository();
    repository.listarAlunos.mockResolvedValueOnce(alunos);
    const service = new GestorService(repository);

    const resultado = await service.listarAlunos(1010);

    expect(repository.listarAlunos).toHaveBeenCalledWith(1010);
    expect(resultado).toEqual(alunos);
  });

  it('deve retornar lista vazia quando nenhum aluno for encontrado', async () => {
    const repository = makeRepository();
    repository.listarAlunos.mockResolvedValueOnce([]);
    const service = new GestorService(repository);

    const resultado = await service.listarAlunos(1010);

    expect(repository.listarAlunos).toHaveBeenCalledWith(1010);
    expect(resultado).toEqual([]);
  });

  it('deve buscar aluno especifico do gestor por RM e RA', async () => {
    const repository = makeRepository();
    repository.buscarAlunoPorRa.mockResolvedValueOnce(alunoDetalhado);
    const service = new GestorService(repository);

    const resultado = await service.buscarAlunoPorRa(1010, 1);

    expect(repository.buscarAlunoPorRa).toHaveBeenCalledWith(1010, 1);
    expect(resultado).toEqual(alunoDetalhado);
  });

  it('deve retornar null quando aluno especifico nao for encontrado', async () => {
    const repository = makeRepository();
    repository.buscarAlunoPorRa.mockResolvedValueOnce(null);
    const service = new GestorService(repository);

    const resultado = await service.buscarAlunoPorRa(1010, 99);

    expect(repository.buscarAlunoPorRa).toHaveBeenCalledWith(1010, 99);
    expect(resultado).toBeNull();
  });

  describe('POST /gestor/comunicados', () => {
    const comunicado = {
      titulo: 'Hackathon Pulse Mais 2026',
      conteudo: 'Confirme sua presenca ate 20/06.',
      destinatarios: 'ativos',
    };

    it('deve delegar o envio e registro do comunicado ao repository', async () => {
      const repository = makeRepository();
      (repository as any).enviarComunicado.mockResolvedValueOnce(undefined);
      const service = new GestorService(repository);

      await (service as any).enviarComunicado(comunicado);

      expect((repository as any).enviarComunicado).toHaveBeenCalledWith(comunicado);
    });

    it('deve propagar erro quando repository falhar ao enviar ou registrar comunicado', async () => {
      const repository = makeRepository();
      (repository as any).enviarComunicado.mockRejectedValueOnce(new Error('Erro no banco'));
      const service = new GestorService(repository);

      await expect((service as any).enviarComunicado(comunicado)).rejects.toThrow(
        'Erro no banco',
      );
      expect((repository as any).enviarComunicado).toHaveBeenCalledWith(comunicado);
    });
  });

  describe('POST /gestor/importacao', () => {
    const arquivoCsv = {
      originalname: 'historico_alunos.csv',
      mimetype: 'text/csv',
      buffer: Buffer.from('ra,nome,cpf\n101,Carlos Sales,12345678900'),
    };

    const resultadoImportacao = {
      importados: 45,
      conflitos: [
        {
          ra: 101,
          motivo: 'CPF ja cadastrado',
        },
      ],
      ignorados: 1,
    };

    it('deve delegar a importacao do CSV ao repository', async () => {
      const repository = makeRepository();
      (repository as any).importarHistoricoCsv.mockResolvedValueOnce(resultadoImportacao);
      const service = new GestorService(repository);

      const resultado = await (service as any).importarHistoricoCsv(arquivoCsv);

      expect((repository as any).importarHistoricoCsv).toHaveBeenCalledWith(arquivoCsv);
      expect(resultado).toEqual(resultadoImportacao);
    });

    it('deve propagar erro quando repository falhar ao processar importacao', async () => {
      const repository = makeRepository();
      (repository as any).importarHistoricoCsv.mockRejectedValueOnce(
        new Error('Erro no banco'),
      );
      const service = new GestorService(repository);

      await expect((service as any).importarHistoricoCsv(arquivoCsv)).rejects.toThrow(
        'Erro no banco',
      );
      expect((repository as any).importarHistoricoCsv).toHaveBeenCalledWith(arquivoCsv);
    });
  });

  // GET /gestor/:rm/alunos/filtros

  describe('GET /gestor/:rm/alunos/filtros', () => {
    const filtros = {
      idade_min: 18,
      idade_max: 25,
      empregabilidade: 'Empregado',
      id_turma: 1,
      eventos_min: 2,
      eventos_max: 10,
      genero: 'M',
    };

    const alunosFiltrados: AlunoGestor[] = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        status: 'Capacitado',
        nivel_formacao: 'Ensino Medio',
        idTurma: 1,
        frequencia: true,
        empregabilidade: {
          empresa: 'Tech Corp',
          cargo: 'Desenvolvedor',
          faixa_salarial: 'R$: 3000,00',
        },
      },
    ];

    it('deve filtrar alunos vinculados ao gestor com filtros informados', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockResolvedValueOnce(alunosFiltrados);
      const service = new GestorService(repository);

      const resultado = await (service as any).filtrarAlunos(1010, filtros);

      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1010, filtros);
      expect(resultado).toEqual(alunosFiltrados);
    });

    it('deve retornar lista vazia quando nenhum aluno corresponder aos filtros', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockResolvedValueOnce([]);
      const service = new GestorService(repository);

      const resultado = await (service as any).filtrarAlunos(1010, filtros);

      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1010, filtros);
      expect(resultado).toEqual([]);
    });

    it('deve propagar erro quando repository falhar ao filtrar alunos', async () => {
      const repository = makeRepository();
      (repository as any).filtrarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));
      const service = new GestorService(repository);

      await expect((service as any).filtrarAlunos(1010, filtros)).rejects.toThrow('Erro no banco');
      expect((repository as any).filtrarAlunos).toHaveBeenCalledWith(1010, filtros);
    });
  });
});