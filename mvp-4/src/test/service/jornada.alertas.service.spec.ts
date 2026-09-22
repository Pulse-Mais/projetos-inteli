import JornadaRepository from '../../repositories/jornadaRepositories';
import JornadaService from '../../services/jornadaServices';

jest.mock('../../repositories/jornadaRepositories', () => ({
  __esModule: true,
  default: {
    findAlertas: jest.fn(),
  },
}));

describe('JornadaService - RF12 Alertas do Aluno', () => {
  const repositoryMock = JornadaRepository as unknown as {
    findAlertas: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock.findAlertas.mockReset();
  });

  it('deve exibir banner quando a frequencia estiver abaixo de 95%', async () => {
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: 88.5,
      alertas: [],
    });

    const resultado = await JornadaService.getAlertas(101);

    expect(repositoryMock.findAlertas).toHaveBeenCalledWith(101);
    expect(resultado).toEqual({
      frequencia_percentual: 88.5,
      limite_frequencia_percentual: 95,
      exibir_banner: true,
      mensagem: 'Sua frequencia esta abaixo do limite esperado. Procure a equipe pedagogica para regularizar sua situacao.',
      alertas: [],
    });
  });

  it('deve exibir banner quando houver alerta ativo de frequencia', async () => {
    const alerta = {
      id_alerta: 12,
      tipo: 'frequencia',
      status: 'ativo',
      descricao: 'Frequencia abaixo do limite exigido.',
      data_alerta: '2026-05-20',
    };
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: 97,
      alertas: [alerta],
    });

    const resultado = await JornadaService.getAlertas(101);

    expect(resultado.exibir_banner).toBe(true);
    expect(resultado.alertas).toEqual([alerta]);
  });

  it('nao deve exibir banner quando frequencia estiver dentro do limite e sem alertas ativos', async () => {
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: 97,
      alertas: [],
    });

    const resultado = await JornadaService.getAlertas(102);

    expect(resultado.exibir_banner).toBe(false);
    expect(resultado.mensagem).toBeNull();
    expect(resultado.alertas).toEqual([]);
  });

  it('deve filtrar alertas resolvidos', async () => {
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: 97,
      alertas: [
        {
          id_alerta: 13,
          tipo: 'frequencia',
          status: 'resolvido',
          descricao: 'Alerta resolvido.',
          data_alerta: '2026-05-21',
        },
      ],
    });

    const resultado = await JornadaService.getAlertas(102);

    expect(resultado.exibir_banner).toBe(false);
    expect(resultado.alertas).toEqual([]);
  });

  it('deve filtrar alertas que nao sejam de frequencia', async () => {
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: 97,
      alertas: [
        {
          id_alerta: 14,
          tipo: 'atividades',
          status: 'ativo',
          descricao: 'Atividades nao entregues.',
          data_alerta: '2026-05-22',
        },
      ],
    });

    const resultado = await JornadaService.getAlertas(102);

    expect(resultado.exibir_banner).toBe(false);
    expect(resultado.alertas).toEqual([]);
  });

  it('deve converter frequencia_percentual para numero', async () => {
    repositoryMock.findAlertas.mockResolvedValueOnce({
      frequencia_percentual: '94.5',
      alertas: [],
    });

    const resultado = await JornadaService.getAlertas(101);

    expect(resultado.frequencia_percentual).toBe(94.5);
    expect(resultado.exibir_banner).toBe(true);
  });

  it('deve propagar erro inesperado do repository', async () => {
    repositoryMock.findAlertas.mockRejectedValueOnce(new Error('Erro no banco'));

    await expect(JornadaService.getAlertas(101)).rejects.toThrow('Erro no banco');
  });
});
