import * as dashboardService from '../../src/services/dashboardService';
import { validarPerfil } from '../../src/helpers/validarPerfil';
import { pool } from '../../src/db/pool';
import * as frequenciaAulaRepo from '../../src/repositories/frequenciaAulaRepository';
import * as participacaoEventoRepo from '../../src/repositories/participacaoEventoRepository';
import * as computadorDoadoRepo from '../../src/repositories/computadorDoadoRepository';
import * as empregabilidadeRepo from '../../src/repositories/empregabilidadeRepository';
import * as ensinoSuperiorRepo from '../../src/repositories/ensinoSuperiorRepository';
import { ForbiddenError } from '../../src/errors/AppError';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/helpers/validarPerfil');
jest.mock('../../src/db/pool');
jest.mock('../../src/repositories/frequenciaAulaRepository');
jest.mock('../../src/repositories/participacaoEventoRepository');
jest.mock('../../src/repositories/computadorDoadoRepository');
jest.mock('../../src/repositories/empregabilidadeRepository');
jest.mock('../../src/repositories/ensinoSuperiorRepository');

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const validarPerfilMock          = jest.mocked(validarPerfil);
const poolMock                   = jest.mocked(pool);
const frequenciaAulaRepoMock     = jest.mocked(frequenciaAulaRepo);
const participacaoEventoRepoMock = jest.mocked(participacaoEventoRepo);
const computadorDoadoRepoMock    = jest.mocked(computadorDoadoRepo);
const empregabilidadeRepoMock    = jest.mocked(empregabilidadeRepo);
const ensinoSuperiorRepoMock     = jest.mocked(ensinoSuperiorRepo);

// ══════════════════════════════════════════════════════════════════════════════
// Factories de pool mock por função
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Pool para obterIndicadores:
 * Discrimina as 3 queries internas (contarAtivos, contarTransformados, calcularEvasao).
 */
function configurarPoolIndicadores(
  ativos: string,
  transformados: string,
  total: string,
  evadidos: string
) {
  (poolMock.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.includes("status_global = 'Ativo'")) {
      return Promise.resolve({ rows: [{ count: ativos }] });
    }
    if (sql.includes("categoria_atual = 'Transformado'")) {
      return Promise.resolve({ rows: [{ count: transformados }] });
    }
    if (sql.includes('evadidos')) {
      return Promise.resolve({ rows: [{ total, evadidos }] });
    }
    return Promise.resolve({ rows: [] });
  });
}

/**
 * Pool para obterDashboardEmpregabilidade:
 * Discrimina 5 queries internas + a de contarTransformados.
 * Ordem importa: "este_ano" antes de "ORDER BY ano" para evitar falso positivo
 * em "AS ano_passado" que contém a substring "ano".
 */
function configurarPoolEmpregabilidade({
  transformados = '4',
  evolucaoPorAno = [{ ano: '2024', count: '3' }],
  distribuicaoPorArea = [{ area: 'TI', count: '2' }],
  progressaoMensal = [{ mes: '2024-01', count: '1' }],
  esteAno = '3',
  anoPassado = '2',
}: {
  transformados?: string;
  evolucaoPorAno?: { ano: string; count: string }[];
  distribuicaoPorArea?: { area: string; count: string }[];
  progressaoMensal?: { mes: string; count: string }[];
  esteAno?: string;
  anoPassado?: string;
} = {}) {
  (poolMock.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.includes("categoria_atual = 'Transformado'")) {
      return Promise.resolve({ rows: [{ count: transformados }] });
    }
    if (sql.includes('area_atuacao')) {
      return Promise.resolve({ rows: distribuicaoPorArea });
    }
    if (sql.includes('YYYY-MM') && sql.includes('empregabilidade')) {
      return Promise.resolve({ rows: progressaoMensal });
    }
    // "este_ano" verificado ANTES de "ORDER BY ano" para evitar falso positivo
    // em "AS ano_passado" que contém "ano"
    if (sql.includes('este_ano') && sql.includes('empregabilidade')) {
      return Promise.resolve({ rows: [{ este_ano: esteAno, ano_passado: anoPassado }] });
    }
    if (sql.includes('empregabilidade') && sql.includes('ORDER BY ano')) {
      return Promise.resolve({ rows: evolucaoPorAno });
    }
    return Promise.resolve({ rows: [] });
  });
}

/**
 * Pool para obterDashboardEngajamento:
 * Discrimina as 4 queries internas (categorias, eventos, aulas, turmas).
 */
function configurarPoolEngajamento({
  categorias = [
    { categoria: 'Conectado',    count: '10' },
    { categoria: 'Capacitado',   count: '5'  },
    { categoria: 'Transformado', count: '3'  },
  ],
  participacaoEventos = [{ tipo: 'Palestra',    taxa: '80.0' }],
  participacaoAulas   = [{ trilha: 'Trilha Tech', taxa: '75.0' }],
  turmas              = [{ turma: 'Turma A',    taxa: '60.0' }],
  evasaoModulos       = [] as { modulo: string; taxa: string }[],
}: {
  categorias?: { categoria: string; count: string }[];
  participacaoEventos?: { tipo: string; taxa: string }[];
  participacaoAulas?: { trilha: string; taxa: string }[];
  turmas?: { turma: string; taxa: string }[];
  evasaoModulos?: { modulo: string; taxa: string }[];
} = {}) {
  (poolMock.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.includes('categoria_atual IS NOT NULL')) {
      return Promise.resolve({ rows: categorias });
    }
    if (sql.includes('participacao_evento')) {
      return Promise.resolve({ rows: participacaoEventos });
    }
    if (sql.includes('frequencia_aula')) {
      return Promise.resolve({ rows: participacaoAulas });
    }
    // A query de evasão e a de turmas usam inscricao_programa; discrimina por 'Evadido'.
    if (sql.includes('inscricao_programa') && sql.includes('Evadido')) {
      return Promise.resolve({ rows: evasaoModulos });
    }
    if (sql.includes('inscricao_programa')) {
      return Promise.resolve({ rows: turmas });
    }
    return Promise.resolve({ rows: [] });
  });
}

/**
 * Pool para obterDashboardEnsinoSuperior:
 * Discrimina 7 queries internas + a de contarTransformados.
 * Ordem importa:
 *   - "COUNT(DISTINCT instituicao)" antes de "GROUP BY instituicao"
 *   - "GROUP BY instituicao" antes de "ORDER BY ano"
 *   - "este_ano" antes de "ORDER BY ano"
 */
function configurarPoolEnsinoSuperior({
  transformados    = '10',
  totalInstituicoes = '3',
  situacao         = [{ situacao: 'Bolsista', count: '5' }],
  topInstituicoes  = [{ instituicao: 'USP',   count: '4' }],
  ingressosPorAno  = [{ ano: '2024',          count: '5' }],
  progressaoMensal = [{ mes: '2024-01',        count: '2' }],
  esteAno          = '4',
  anoPassado       = '2',
}: {
  transformados?: string;
  totalInstituicoes?: string;
  situacao?: { situacao: string; count: string }[];
  topInstituicoes?: { instituicao: string; count: string }[];
  ingressosPorAno?: { ano: string; count: string }[];
  progressaoMensal?: { mes: string; count: string }[];
  esteAno?: string;
  anoPassado?: string;
} = {}) {
  (poolMock.query as jest.Mock).mockImplementation((sql: string) => {
    if (sql.includes("categoria_atual = 'Transformado'")) {
      return Promise.resolve({ rows: [{ count: transformados }] });
    }
    // COUNT(DISTINCT) antes de GROUP BY instituicao (ambas mencionam "instituicao")
    if (sql.includes('COUNT(DISTINCT instituicao)')) {
      return Promise.resolve({ rows: [{ count: String(totalInstituicoes) }] });
    }
    if (sql.includes('COALESCE(situacao')) {
      return Promise.resolve({ rows: situacao });
    }
    // GROUP BY instituicao antes de ORDER BY ano (evita falso positivo)
    if (sql.includes('GROUP BY instituicao')) {
      return Promise.resolve({ rows: topInstituicoes });
    }
    if (sql.includes('YYYY-MM') && sql.includes('ensino_superior')) {
      return Promise.resolve({ rows: progressaoMensal });
    }
    // este_ano antes de ORDER BY ano (evita falso positivo em "AS ano_passado")
    if (sql.includes('este_ano') && sql.includes('ensino_superior')) {
      return Promise.resolve({ rows: [{ este_ano: esteAno, ano_passado: anoPassado }] });
    }
    if (sql.includes('ensino_superior') && sql.includes('ORDER BY ano')) {
      return Promise.resolve({ rows: ingressosPorAno });
    }
    return Promise.resolve({ rows: [] });
  });
}

// ── beforeEach global ─────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  // validarPerfil resolve por padrão (Gestao autorizado)
  validarPerfilMock.mockResolvedValue(undefined);

  // Repos delegados com valores padrão para obterIndicadores
  empregabilidadeRepoMock.contarEmpregados.mockResolvedValue(8);
  empregabilidadeRepoMock.calcularIncrementoRendaMedio.mockResolvedValue(500);
  ensinoSuperiorRepoMock.contarComIngressoSuperior.mockResolvedValue(3);
  computadorDoadoRepoMock.totalNaoDevolvidos.mockResolvedValue(12);
  frequenciaAulaRepoMock.buscarMapaPresenca.mockResolvedValue([
    { id_jovem: 1, taxa_presenca: 90 },
  ]);
  participacaoEventoRepoMock.buscarCalendario.mockResolvedValue([
    { evento: 'Palestra', data: new Date('2025-03-01'), total_participantes: 15 },
  ]);
});

// ══════════════════════════════════════════════════════════════════════════════
// obterIndicadores
// ══════════════════════════════════════════════════════════════════════════════
describe('obterIndicadores', () => {
  // CT01 — sucesso: todos os 9 indicadores retornados               RN15b, RF008
  test('CT01 — sucesso: perfil Gestao autorizado, retorna todos os 9 indicadores (RN15b · RF008)', async () => {
    // Arrange — 5 ativos, 3 transformados, 2 de 10 evadidos = 20%
    configurarPoolIndicadores('5', '3', '10', '2');

    // Act
    const resultado = await dashboardService.obterIndicadores(1);

    // Assert
    expect(resultado).toMatchObject({
      totalAtivos:            5,
      totalEmpregados:        8,
      totalGraduacao:         3,
      percentualEvasao:       20,
      totalTransformados:     3,
      incrementoRendaMedio:   500,
      totalComputadoresDoados: 12,
    });
    expect(Array.isArray(resultado.mapaPresenca)).toBe(true);
    expect(resultado.mapaPresenca).toHaveLength(1);
    expect(Array.isArray(resultado.calendarioEventos)).toBe(true);
    expect(resultado.calendarioEventos).toHaveLength(1);
    expect(validarPerfilMock).toHaveBeenCalledWith(1, ['Gestao']);
  });

  // CT02 — ForbiddenError quando perfil não autorizado               RN15, RF008
  test('CT02 — ForbiddenError quando usuário não tem perfil Gestao (RN15 · RF008)', async () => {
    // Arrange
    validarPerfilMock.mockRejectedValue(
      new ForbiddenError('perfil Coordenacao não autorizado')
    );

    // Act
    const promise = dashboardService.obterIndicadores(99);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ForbiddenError);
    expect(empregabilidadeRepoMock.contarEmpregados).not.toHaveBeenCalled();
    expect(frequenciaAulaRepoMock.buscarMapaPresenca).not.toHaveBeenCalled();
  });

  // CT03 — evasão retorna 0 quando total de jovens é zero            RN15, RF008
  test('CT03 — percentualEvasao retorna 0 quando não há jovens cadastrados (RN15 · RF008)', async () => {
    // Arrange — total = 0 aciona o guard if (total === 0) return 0
    configurarPoolIndicadores('0', '0', '0', '0');

    // Act
    const resultado = await dashboardService.obterIndicadores(1);

    // Assert
    expect(resultado.percentualEvasao).toBe(0);
    expect(resultado.totalAtivos).toBe(0);
    expect(resultado.totalTransformados).toBe(0);
  });

  // CT04 — percentual de evasão calculado corretamente               RN15, RF008
  test('CT04 — percentualEvasao calculado corretamente: 1 de 4 jovens evadido = 25% (RN15 · RF008)', async () => {
    // Arrange
    configurarPoolIndicadores('3', '1', '4', '1');

    // Act
    const resultado = await dashboardService.obterIndicadores(1);

    // Assert — (1/4) * 100 = 25.00
    expect(resultado.percentualEvasao).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// obterDashboardEmpregabilidade
// ══════════════════════════════════════════════════════════════════════════════
describe('obterDashboardEmpregabilidade', () => {
  // CT05 — sucesso: todos os indicadores com taxas calculadas         RF008, RN15b
  test('CT05 — sucesso: retorna todos os indicadores com taxas e séries corretas (RF008 · RN15b)', async () => {
    // Arrange
    empregabilidadeRepoMock.contarEmpregados.mockResolvedValue(8);
    empregabilidadeRepoMock.calcularIncrementoRendaMedio.mockResolvedValue(450.75);
    configurarPoolEmpregabilidade({
      transformados:    '10',
      evolucaoPorAno:   [{ ano: '2024', count: '3' }],
      distribuicaoPorArea: [{ area: 'TI', count: '5' }],
      progressaoMensal: [{ mes: '2024-01', count: '2' }],
      esteAno:          '4',
      anoPassado:       '2',
    });

    // Act
    const resultado = await dashboardService.obterDashboardEmpregabilidade();

    // Assert
    expect(resultado.totalEmpregados).toBe(8);
    expect(resultado.totalTransformados).toBe(10);
    expect(resultado.deltaMedioRenda).toBe(450.75);
    // taxaEmpregabilidade = (8 / 10) * 100 = 80.0
    expect(resultado.taxaEmpregabilidade).toBe(80);
    // taxaVariacao = ((4 - 2) / 2) * 100 = 100.0
    expect(resultado.taxaVariacao).toBe(100);
    expect(resultado.evolucaoPorAno).toEqual([{ ano: '2024', count: 3 }]);
    expect(resultado.distribuicaoPorArea).toEqual([{ area: 'TI', count: 5 }]);
    expect(resultado.progressaoMensal).toEqual([{ mes: '2024-01', count: 2 }]);
    // Campos ainda não implementados no service
    expect(resultado.tempoMedioEmprego).toBe(0);
    expect(resultado.deltaRenda).toEqual([]);
  });

  // CT06 — taxaVariacao = 0 quando anoPassado é zero                 RF008, RN15b
  test('CT06 — taxaVariacao retorna 0 quando anoPassado é zero (sem divisão por zero) (RF008 · RN15b)', async () => {
    // Arrange
    empregabilidadeRepoMock.contarEmpregados.mockResolvedValue(5);
    empregabilidadeRepoMock.calcularIncrementoRendaMedio.mockResolvedValue(300);
    configurarPoolEmpregabilidade({
      transformados: '5',
      esteAno:       '3',
      anoPassado:    '0',   // ← guard: anoPassado > 0 → false
    });

    // Act
    const resultado = await dashboardService.obterDashboardEmpregabilidade();

    // Assert
    expect(resultado.taxaVariacao).toBe(0);
  });

  // CT07 — taxaEmpregabilidade = 0 quando totalTransformados é zero   RF008, RN15b
  test('CT07 — taxaEmpregabilidade retorna 0 quando não há transformados (sem divisão por zero) (RF008 · RN15b)', async () => {
    // Arrange
    empregabilidadeRepoMock.contarEmpregados.mockResolvedValue(4);
    empregabilidadeRepoMock.calcularIncrementoRendaMedio.mockResolvedValue(200);
    configurarPoolEmpregabilidade({
      transformados: '0',   // ← guard: totalTransformados > 0 → false
      esteAno:       '0',
      anoPassado:    '0',
    });

    // Act
    const resultado = await dashboardService.obterDashboardEmpregabilidade();

    // Assert
    expect(resultado.taxaEmpregabilidade).toBe(0);
    expect(resultado.taxaVariacao).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// obterDashboardEngajamento
// ══════════════════════════════════════════════════════════════════════════════
describe('obterDashboardEngajamento', () => {
  // CT08 — sucesso: contagens e métricas calculadas corretamente       RF008, RN15b
  test('CT08 — sucesso: retorna contagem por categoria, taxaSucesso e participação (RF008 · RN15b)', async () => {
    // Arrange
    configurarPoolEngajamento({
      categorias: [
        { categoria: 'Conectado',    count: '10' },
        { categoria: 'Capacitado',   count: '5'  },
        { categoria: 'Transformado', count: '3'  },
      ],
      participacaoEventos: [{ tipo: 'Hackathon',    taxa: '82.5' }],
      participacaoAulas:   [{ trilha: 'Trilha Tech', taxa: '76.3' }],
      turmas:              [{ turma: 'Turma A',      taxa: '65.0' }],
    });

    // Act
    const resultado = await dashboardService.obterDashboardEngajamento();

    // Assert
    expect(resultado.conectados).toBe(10);
    expect(resultado.capacitados).toBe(5);
    expect(resultado.transformados).toBe(3);
    // taxaSucesso = (3 / 18) * 100 = 16.7
    expect(resultado.taxaSucesso).toBe(16.7);
    expect(resultado.participacaoEventos).toEqual([{ tipo: 'Hackathon',    taxa: 82.5 }]);
    expect(resultado.participacaoAulas).toEqual([{ trilha: 'Trilha Tech', taxa: 76.3 }]);
    expect(resultado.turmas).toEqual([{ turma: 'Turma A', taxa: 65.0 }]);
    expect(resultado.evasaoModulos).toEqual([]);
  });

  // CT09 — taxaSucesso = 0 quando total de jovens é zero              RF008, RN15b
  test('CT09 — taxaSucesso retorna 0 quando não há jovens cadastrados (sem divisão por zero) (RF008 · RN15b)', async () => {
    // Arrange — banco retorna array vazio → total = 0
    configurarPoolEngajamento({ categorias: [] });

    // Act
    const resultado = await dashboardService.obterDashboardEngajamento();

    // Assert — total = 0 aciona o guard: taxaSucesso = 0
    expect(resultado.taxaSucesso).toBe(0);
    expect(resultado.conectados).toBe(0);
    expect(resultado.capacitados).toBe(0);
    expect(resultado.transformados).toBe(0);
  });

  // CT10 — categorias ausentes no resultado derivam para 0             RF008, RN15b
  test('CT10 — categorias ausentes no banco retornam 0 via nullish coalescing (RF008 · RN15b)', async () => {
    // Arrange — banco retorna apenas Transformado; Conectado e Capacitado ausentes
    configurarPoolEngajamento({
      categorias: [{ categoria: 'Transformado', count: '5' }],
    });

    // Act
    const resultado = await dashboardService.obterDashboardEngajamento();

    // Assert — byCategoria['Conectado'] ?? 0 = 0 (chave inexistente)
    expect(resultado.conectados).toBe(0);
    expect(resultado.capacitados).toBe(0);
    expect(resultado.transformados).toBe(5);
    // taxaSucesso = (5 / 5) * 100 = 100.0
    expect(resultado.taxaSucesso).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// obterDashboardEnsinoSuperior
// ══════════════════════════════════════════════════════════════════════════════
describe('obterDashboardEnsinoSuperior', () => {
  // CT11 — sucesso: todos os indicadores com taxas calculadas          RF007, RF008, RN15b
  test('CT11 — sucesso: retorna todos os indicadores com taxas e séries corretas (RF007 · RF008 · RN15b)', async () => {
    // Arrange
    ensinoSuperiorRepoMock.contarComIngressoSuperior.mockResolvedValue(6);
    configurarPoolEnsinoSuperior({
      transformados:    '10',
      totalInstituicoes: '4',
      situacao:         [{ situacao: 'Concluido', count: '4' }],
      topInstituicoes:  [{ instituicao: 'USP',   count: '3' }],
      ingressosPorAno:  [{ ano: '2024',           count: '6' }],
      progressaoMensal: [{ mes: '2024-06',         count: '2' }],
      esteAno:          '4',
      anoPassado:       '2',
    });

    // Act
    const resultado = await dashboardService.obterDashboardEnsinoSuperior();

    // Assert
    expect(resultado.totalIngressantes).toBe(6);
    expect(resultado.totalTransformados).toBe(10);
    expect(resultado.totalInstituicoes).toBe(4);
    // taxaIngresso = (6 / 10) * 100 = 60.0
    expect(resultado.taxaIngresso).toBe(60);
    // taxaVariacao = ((4 - 2) / 2) * 100 = 100.0
    expect(resultado.taxaVariacao).toBe(100);
    expect(resultado.situacao).toEqual([{ situacao: 'Concluido', count: 4 }]);
    expect(resultado.topInstituicoes).toEqual([{ instituicao: 'USP', count: 3 }]);
    expect(resultado.ingressosPorAno).toEqual([{ ano: '2024', count: 6 }]);
    expect(resultado.progressaoMensal).toEqual([{ mes: '2024-06', count: 2 }]);
    // concluidos/pctConcluidos derivados da distribuição por situação (novo domínio):
    // situacao = [{ Concluido: 4 }] → concluidos = 4, pctConcluidos = 4/4 * 100 = 100
    expect(resultado.concluidos).toBe(4);
    expect(resultado.pctConcluidos).toBe(100);
  });

  // CT12 — taxaVariacao = 0 quando anoPassado é zero                  RF007, RF008, RN15b
  test('CT12 — taxaVariacao retorna 0 quando anoPassado é zero (sem divisão por zero) (RF007 · RF008 · RN15b)', async () => {
    // Arrange
    ensinoSuperiorRepoMock.contarComIngressoSuperior.mockResolvedValue(3);
    configurarPoolEnsinoSuperior({
      transformados: '5',
      esteAno:       '2',
      anoPassado:    '0',   // ← guard: anoPassado > 0 → false
    });

    // Act
    const resultado = await dashboardService.obterDashboardEnsinoSuperior();

    // Assert
    expect(resultado.taxaVariacao).toBe(0);
  });

  // CT13 — taxaIngresso = 0 quando totalTransformados é zero           RF007, RF008, RN15b
  test('CT13 — taxaIngresso retorna 0 quando não há transformados (sem divisão por zero) (RF007 · RF008 · RN15b)', async () => {
    // Arrange
    ensinoSuperiorRepoMock.contarComIngressoSuperior.mockResolvedValue(2);
    configurarPoolEnsinoSuperior({
      transformados: '0',   // ← guard: totalTransformados > 0 → false
      esteAno:       '0',
      anoPassado:    '0',
    });

    // Act
    const resultado = await dashboardService.obterDashboardEnsinoSuperior();

    // Assert
    expect(resultado.taxaIngresso).toBe(0);
    expect(resultado.taxaVariacao).toBe(0);
  });

  // CT14 — taxaIngresso limitada a 100% quando ingressantes > transformados  RF007, RF008, RN15b
  test('CT14 — taxaIngresso é limitada a 100% quando ingressantes excede transformados (RF007 · RF008 · RN15b)', async () => {
    // Arrange — ingressantes (9) inclui jovens de outras categorias além de Transformado (7)
    ensinoSuperiorRepoMock.contarComIngressoSuperior.mockResolvedValue(9);
    configurarPoolEnsinoSuperior({
      transformados: '7',
      esteAno:       '0',
      anoPassado:    '0',
    });

    // Act
    const resultado = await dashboardService.obterDashboardEnsinoSuperior();

    // Assert — sem o cap seria 128.6%, logicamente impossível
    expect(resultado.taxaIngresso).toBe(100);
  });
});
