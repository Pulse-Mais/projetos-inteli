import pool from '../../database/connection';
import { Aluno } from '../../database/models/aluno.model';
import { AlunoRepository } from '../../repositories/aluno.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('AlunoRepository', () => {
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
    email_primario: 'carlos@email.com',
    tel_primario: '11999999999',
    cep: '00000000',
    endereco: 'Rua Teste',
    renda_familiar: '1000',
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('deve buscar aluno por RA usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [aluno] });
    const repository = new AlunoRepository();

    const resultado = await repository.buscarPorRA(1);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM aluno'),
      [1],
    );
    expect(resultado).toEqual(aluno);
  });

  it('deve retornar null quando nenhum aluno for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new AlunoRepository();

    const resultado = await repository.buscarPorRA(99);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM aluno'),
      [99],
    );
    expect(resultado).toBeNull();
  });

  it('deve atualizar apenas os campos recebidos', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const repository = new AlunoRepository();

    await repository.atualizar(1, {
      email_primario: 'novo@email.com',
      tel_primario: '11988888888',
    });

    expect(queryMock).toHaveBeenCalledWith(
      'UPDATE aluno SET email_primario = $1, tel_primario = $2 WHERE ra = $3',
      ['novo@email.com', '11988888888', 1],
    );
  });

  it('nao deve executar query quando nenhum campo for enviado para atualizar', async () => {
    const repository = new AlunoRepository();

    await repository.atualizar(1, {});

    expect(queryMock).not.toHaveBeenCalled();
  });
});
