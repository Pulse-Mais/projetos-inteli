import { EmpregoRepository } from '../../repositories/emprego.repository';
import { EmpregoService } from '../../services/emprego.service';


describe('EmpregoService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });


  it('deve registrar emprego quando aluno existe e nao possui emprego ativo', async () => {
    jest.spyOn(EmpregoRepository, 'buscarAlunoPorRa').mockResolvedValueOnce({ ra: 101 });
    jest.spyOn(EmpregoRepository, 'buscarEmpregoAtivo').mockResolvedValueOnce(null);
    jest.spyOn(EmpregoRepository, 'inserirEmprego').mockResolvedValueOnce({ id_emprego: 7 });
    jest.spyOn(EmpregoRepository, 'atualizarStatusAluno').mockResolvedValueOnce(undefined);


    const resultado = await EmpregoService.registrarEmprego(101, {
      empresa: 'Tech Corp',
      cargo: 'Dev Jr',
      data_inicio: '2026-05-01',
      faixa_salarial: '3000-5000',
    });


    expect(EmpregoRepository.inserirEmprego).toHaveBeenCalledWith(101, {
      empresa: 'Tech Corp',
      cargo: 'Dev Jr',
      data_inicio: '2026-05-01',
      faixa_salarial: '3000-5000',
    });
    expect(EmpregoRepository.atualizarStatusAluno).toHaveBeenCalledWith(101, 'Empregado');
    expect(resultado).toEqual({
      message: 'Emprego registrado com sucesso. Status do aluno atualizado para Empregado.',
      id_emprego: 7,
    });
  });


  it('deve bloquear registro quando aluno ja possui emprego ativo', async () => {
    jest.spyOn(EmpregoRepository, 'buscarAlunoPorRa').mockResolvedValueOnce({ ra: 101 });
    jest.spyOn(EmpregoRepository, 'buscarEmpregoAtivo').mockResolvedValueOnce({
      id_emprego: 7,
      empresa: 'Tech Corp',
      cargo: 'Dev Jr',
      data_inicio: '2026-05-01',
    });
    jest.spyOn(EmpregoRepository, 'inserirEmprego');


    await expect(
      EmpregoService.registrarEmprego(101, {
        empresa: 'Outra Empresa',
        cargo: 'Dev Pleno',
        data_inicio: '2026-08-01',
        faixa_salarial: '5000-7000',
      }),
    ).rejects.toMatchObject({ status: 409 });


    expect(EmpregoRepository.inserirEmprego).not.toHaveBeenCalled();
  });


  it('deve encerrar emprego existente', async () => {
    jest.spyOn(EmpregoRepository, 'buscarEmpregoPorId').mockResolvedValueOnce({
      id_emprego: 7,
      data_inicio: '2026-05-01',
    });
    jest.spyOn(EmpregoRepository, 'encerrarEmprego').mockResolvedValueOnce(undefined);


    const resultado = await EmpregoService.encerrarEmprego(101, 7, '2026-12-31');


    expect(EmpregoRepository.encerrarEmprego).toHaveBeenCalledWith(101, 7, '2026-12-31');
    expect(resultado).toEqual({
      message: 'Emprego encerrado com sucesso. Registro mantido no historico.',
    });
  });


  it('deve rejeitar encerramento anterior a data de inicio', async () => {
    jest.spyOn(EmpregoRepository, 'buscarEmpregoPorId').mockResolvedValueOnce({
      id_emprego: 7,
      data_inicio: '2026-05-01',
    });
    jest.spyOn(EmpregoRepository, 'encerrarEmprego');


    await expect(EmpregoService.encerrarEmprego(101, 7, '2026-04-30')).rejects.toMatchObject({
      status: 422,
    });
    expect(EmpregoRepository.encerrarEmprego).not.toHaveBeenCalled();
  });


  it('deve listar historico de empregos do aluno', async () => {
    const historico = [
      {
        id_emprego: 7,
        empresa: 'Tech Corp',
        cargo: 'Dev Jr',
        data_inicio: '2026-05-01',
        data_encerramento: null,
        faixa_salarial: '3000-5000',
        ativo: true,
      },
    ];


    jest.spyOn(EmpregoRepository, 'buscarAlunoPorRa').mockResolvedValueOnce({ ra: 101 });
    jest.spyOn(EmpregoRepository, 'listarEmpregosPorRa').mockResolvedValueOnce(historico);


    const resultado = await EmpregoService.listarEmpregos(101);


    expect(resultado).toEqual({
      ra: 101,
      historico_empregos: historico,
    });
  });
});
