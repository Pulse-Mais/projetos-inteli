import * as auditoriaService from '../../src/services/auditoriaService';
import * as historicoRepo from '../../src/repositories/historicoAcoesRepository';
import type { HistoricoAcoes } from '../../src/models/historicoAcoes';

// Mocks de módulo
jest.mock('../../src/repositories/historicoAcoesRepository');

// Helper de fixture
function makeHistoricoAcoes(overrides: Partial<HistoricoAcoes> = {}): HistoricoAcoes {
  return {
    id: 1,
    id_usuario: 2,
    id_jovem_afetado: 10,
    acao: 'criou jovem',
    tabela_afetada: 'jovem',
    valor_anterior: null,
    data_hora: new Date('2025-01-01'),
    ...overrides,
  };
}

// Referência tipada ao mock
const historicoRepoMock = jest.mocked(historicoRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

// Registro
describe('registrar', () => {
  // CT01
  test('CT01 — chama historicoRepo.inserir com os params corretos (RN19b · RF010)', async () => {
    // Arrange
    historicoRepoMock.inserir.mockResolvedValue(makeHistoricoAcoes());

    const params = {
      id_usuario: 2,
      id_jovem_afetado: 10,
      acao: 'criou jovem',
      tabela_afetada: 'jovem',
      valor_anterior: null,
    };

    // Registrar é void e fire-and-forget
    auditoriaService.registrar(params);

    // Flush da microtask queue para o inserir mock ser invocado
    await Promise.resolve();

    // Assert
    expect(historicoRepoMock.inserir).toHaveBeenCalledWith(
      expect.objectContaining({
        id_usuario: 2,
        id_jovem_afetado: 10,
        acao: 'criou jovem',
        tabela_afetada: 'jovem',
        valor_anterior: null,
      })
    );
  });

  // CT02
  test('CT02 — não lança nem propaga erro quando repo.inserir rejeita (RN19b · RF010)', async () => {
    // Arrange
    historicoRepoMock.inserir.mockRejectedValue(new Error('DB down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    let threw = false;
    try {
      auditoriaService.registrar({ id_usuario: 1, acao: 'teste', tabela_afetada: 'jovem' });
    } catch {
      threw = true;
    }
    await Promise.resolve(); // esgota a microtask queue para o .catch interno ser executado

    // Assert
    expect(threw).toBe(false); // fire-and-forget não deve lançar
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // CT03
  test('CT03 — funciona corretamente quando campos opcionais são omitidos (RN19b · RF010)', async () => {
    // Arrange
    historicoRepoMock.inserir.mockResolvedValue(
      makeHistoricoAcoes({ id_jovem_afetado: null, valor_anterior: null })
    );

    // Act
    auditoriaService.registrar({ id_usuario: 1, acao: 'ação simples', tabela_afetada: 'usuario' });
    await Promise.resolve();

    // Campos opcionais devem ser null
    expect(historicoRepoMock.inserir).toHaveBeenCalledWith(
      expect.objectContaining({
        id_jovem_afetado: null,
        valor_anterior: null,
      })
    );
  });
});