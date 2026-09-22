import pool from '../../database/connection';
import { EmpregoRepository } from '../../repositories/emprego.repository';


jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));


describe('EmpregoRepository', () => {
  const queryMock = pool.query as jest.Mock;


  beforeEach(() => {
    queryMock.mockReset();
  });


  it('deve buscar aluno por RA', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ ra: 101 }] });


    const resultado = await EmpregoRepository.buscarAlunoPorRa(101);


    expect(queryMock).toHaveBeenCalledWith('SELECT ra FROM aluno WHERE ra = $1', [101]);
    expect(resultado).toEqual({ ra: 101 });
  });


  it('deve buscar apenas emprego ativo do aluno', async () => {
    const empregoAtivo = {
      id_emprego: 7,
      empresa: 'Tech Corp',
      cargo: 'Dev Jr',
      data_inicio: '2026-05-01',
    };


    queryMock.mockResolvedValueOnce({ rows: [empregoAtivo] });


    const resultado = await EmpregoRepository.buscarEmpregoAtivo(101);


    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('data_encerramento IS NULL'),
      [101],
    );
    expect(resultado).toEqual(empregoAtivo);
  });


  it('deve inserir emprego com query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_emprego: 7 }] });


    const resultado = await EmpregoRepository.inserirEmprego(101, {
      empresa: 'Tech Corp',
      cargo: 'Dev Jr',
      data_inicio: '2026-05-01',
      faixa_salarial: '3000-5000',
    });


    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO empregabilidade'),
      [101, 'Tech Corp', 'Dev Jr', '2026-05-01', '3000-5000'],
    );
    expect(resultado).toEqual({ id_emprego: 7 });
  });


  it('deve encerrar emprego por RA e id_emprego', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });


    await EmpregoRepository.encerrarEmprego(101, 7, '2026-12-31');


    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('SET data_encerramento = $1'),
      ['2026-12-31', 101, 7],
    );
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


    queryMock.mockResolvedValueOnce({ rows: historico });


    const resultado = await EmpregoRepository.listarEmpregosPorRa(101);


    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY data_inicio DESC'),
      [101],
    );
    expect(resultado).toEqual(historico);
  });
});
