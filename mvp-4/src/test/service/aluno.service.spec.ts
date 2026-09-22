import * as fs from 'fs/promises';
import path from 'path';
import { Aluno } from '../../database/models/aluno.model';
import { AlunoRepository } from '../../repositories/aluno.repository';
import { AlunoService } from '../../services/aluno.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

describe('AlunoService', () => {
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

  const makeRepository = () =>
    ({
      buscarPorRA: jest.fn(),
      atualizar: jest.fn(),
    } as unknown as jest.Mocked<AlunoRepository>);

  beforeEach(() => {
    jest.restoreAllMocks();
    (fs.mkdir as jest.Mock).mockReset().mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockReset().mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockReset().mockResolvedValue(undefined);
  });

  it('deve buscar aluno por RA', async () => {
    const repository = makeRepository();
    repository.buscarPorRA.mockResolvedValueOnce(aluno);
    const service = new AlunoService(repository);

    const resultado = await service.buscarPorRA(1);

    expect(repository.buscarPorRA).toHaveBeenCalledWith(1);
    expect(resultado).toEqual(aluno);
  });

  it('deve retornar null quando aluno nao for encontrado', async () => {
    const repository = makeRepository();
    repository.buscarPorRA.mockResolvedValueOnce(null);
    const service = new AlunoService(repository);

    const resultado = await service.buscarPorRA(99);

    expect(repository.buscarPorRA).toHaveBeenCalledWith(99);
    expect(resultado).toBeNull();
  });

  it('deve atualizar aluno existente', async () => {
    const repository = makeRepository();
    const dados = { email_primario: 'novo@email.com' };
    repository.buscarPorRA.mockResolvedValueOnce(aluno);
    repository.atualizar.mockResolvedValueOnce(undefined);
    const service = new AlunoService(repository);

    await service.atualizar(1, dados);

    expect(repository.buscarPorRA).toHaveBeenCalledWith(1);
    expect(repository.atualizar).toHaveBeenCalledWith(1, dados);
  });

  it('deve salvar a foto em arquivo e persistir um caminho curto', async () => {
    const repository = makeRepository();
    const foto = 'data:image/png;base64,aGVsbG8=';
    repository.buscarPorRA.mockResolvedValueOnce({ ...aluno, foto: '/aluno/uploads/1-antiga.png' });
    repository.atualizar.mockResolvedValueOnce(undefined);
    jest.spyOn(Date, 'now').mockReturnValue(1719230000000);
    const service = new AlunoService(repository);

    await service.atualizar(1, { foto });

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'view', 'aluno', 'uploads', '1-1719230000000.png'),
      Buffer.from('aGVsbG8=', 'base64'),
    );
    expect(fs.unlink).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'view', 'aluno', 'uploads', '1-antiga.png'),
    );
    expect(repository.atualizar).toHaveBeenCalledWith(1, {
      foto: '/aluno/uploads/1-1719230000000.png',
    });
  });

  it('deve rejeitar foto com formato invalido', async () => {
    const repository = makeRepository();
    repository.buscarPorRA.mockResolvedValueOnce(aluno);
    const service = new AlunoService(repository);

    await expect(service.atualizar(1, { foto: 'data:text/plain;base64,Zm9v' })).rejects.toThrow(
      'Formato de foto invalido. Envie PNG, JPG ou WEBP.',
    );
    expect(repository.atualizar).not.toHaveBeenCalled();
  });

  it('deve lancar erro ao atualizar aluno inexistente', async () => {
    const repository = makeRepository();
    const dados = { email_primario: 'novo@email.com' };
    repository.buscarPorRA.mockResolvedValueOnce(null);
    const service = new AlunoService(repository);

    await expect(service.atualizar(99, dados)).rejects.toThrow(/Aluno.*encontrado/);
    expect(repository.buscarPorRA).toHaveBeenCalledWith(99);
    expect(repository.atualizar).not.toHaveBeenCalled();
  });
});
