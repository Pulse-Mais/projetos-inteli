/**
 * Cenarios de sucesso (HTTP 200 / 201) — testes de integracao black-box.
 *
 * Cobertura: testa o caminho feliz de cada endpoint principal da WebAPI
 * fazendo requisicoes reais ao app Express via Supertest, com os
 * services mockados para isolar a camada HTTP da logica de negocio e
 * garantir determinismo.
 *
 * Padrao AAA (Arrange, Act, Assert) explicitamente comentado em cada teste.
 *
 * Garantias:
 *   - Determinismo total (sem banco, sem rede, sem relogio do sistema)
 *   - Independencia de ordem (clearMocks limpa estado entre blocos)
 *   - Cobertura do contrato HTTP de cada endpoint principal
 *
 * Veja src/tests/README.md para a convencao de testes.
 */

// jest.mock e hoisted; precisa vir antes da importacao do app.
jest.mock('../services/usuarioService');
jest.mock('../services/alunoService');
jest.mock('../services/mentorService');
jest.mock('../services/mentoriaService');
jest.mock('../services/programaService');
jest.mock('../services/eventoService');
jest.mock('../services/indicadorService');
jest.mock('../services/avaliacaoService');
jest.mock('../services/atividadeService');
jest.mock('../services/entregaService');
jest.mock('../services/importacaoService');
jest.mock('../services/dashboardService');
jest.mock('../services/acompanhaService');
// historicoProfissionalController nao passa por service — usa o repo direto.
jest.mock('../repositories/historicoProfissionalRepository');
jest.mock('../repositories/alunoRepository');
// healthcheck consulta o supabaseClient direto; mockamos a chamada select().limit().
jest.mock('../db/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

import request from 'supertest';
import { app } from '../app';

import * as usuarioSvc from '../services/usuarioService';
import * as alunoSvc from '../services/alunoService';
import * as mentorSvc from '../services/mentorService';
import * as mentoriaSvc from '../services/mentoriaService';
import * as programaSvc from '../services/programaService';
import * as eventoSvc from '../services/eventoService';
import * as indicadorSvc from '../services/indicadorService';
import * as avaliacaoSvc from '../services/avaliacaoService';
import * as atividadeSvc from '../services/atividadeService';
import * as entregaSvc from '../services/entregaService';
import * as importacaoSvc from '../services/importacaoService';
import * as dashboardSvc from '../services/dashboardService';
import * as acompanhaSvc from '../services/acompanhaService';
import * as historicoRepo from '../repositories/historicoProfissionalRepository';
import * as alunoRepo from '../repositories/alunoRepository';

const mocked = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;

describe('Cenarios de sucesso 200/201 — black-box via Supertest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // HEALTH
  // ==========================================================================
  describe('GET /health', () => {
    it('retorna 200 com status ok quando o supabase responde', async () => {
      // Arrange — supabaseClient mockado no topo retorna data: []

      // Act
      const res = await request(app).get('/health');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        db: 'connected',
        project: 'Pulse Mais G01',
      });
    });
  });

  // ==========================================================================
  // USUARIOS
  // ==========================================================================
  describe('/usuarios', () => {
    it('GET /usuarios retorna 200 com lista de usuarios', async () => {
      // Arrange
      const lista = [{ id_usuario: 1, nome: 'A', email: 'a@x', cpf: '1', senha: 'h' }];
      mocked(usuarioSvc.listarUsuarios).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/usuarios');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /usuarios/:id retorna 200 com o usuario', async () => {
      // Arrange
      const usuario = { id_usuario: 1, nome: 'A', email: 'a@x', cpf: '1', senha: 'h' };
      mocked(usuarioSvc.buscarUsuario).mockResolvedValue(usuario as any);

      // Act
      const res = await request(app).get('/usuarios/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(usuario);
      expect(mocked(usuarioSvc.buscarUsuario)).toHaveBeenCalledWith(1);
    });

    it('POST /usuarios retorna 201 com o usuario criado', async () => {
      // Arrange
      const body = { nome: 'N', email: 'n@x', senha: '123', cpf: '1' };
      const criado = { id_usuario: 10, ...body };
      mocked(usuarioSvc.criarUsuario).mockResolvedValue(criado as any);

      // Act
      const res = await request(app).post('/usuarios').send(body);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // ALUNOS
  // ==========================================================================
  describe('/alunos', () => {
    it('GET /alunos retorna 200 com lista filtrada (default ativo=true)', async () => {
      // Arrange
      const lista = [
        { id_usuario: 1, id_mentor: null, ativo: true, usuario: { nome: 'A', email: 'a@x', cpf: '1' } },
      ];
      mocked(alunoSvc.listarAlunos).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/alunos');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
      // Controller delega o default `ativo=true` para o service (passa {} quando
      // nao ha query). Aqui validamos apenas que o service foi chamado.
      expect(mocked(alunoSvc.listarAlunos)).toHaveBeenCalledWith({});
    });

    it('GET /alunos/:id retorna 200 com o aluno', async () => {
      // Arrange
      const aluno = { id_usuario: 1, id_mentor: null, ativo: true };
      mocked(alunoSvc.buscarAluno).mockResolvedValue(aluno as any);

      // Act
      const res = await request(app).get('/alunos/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(aluno);
    });

    it('POST /alunos retorna 201 com o aluno criado', async () => {
      // Arrange
      const body = { id_usuario: 1 };
      const criado = { id_usuario: 1, id_mentor: null, ativo: true };
      mocked(alunoSvc.criarAluno).mockResolvedValue(criado as any);

      // Act
      const res = await request(app).post('/alunos').send(body);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });

    it('GET /alunos/:id/perfil retorna 200 com o perfil consolidado', async () => {
      // Arrange
      const perfil = {
        usuario: { nome: 'A', email: 'a@x', cpf: '1' },
        programas: [],
        eventos: [],
        avaliacoes: [],
        mentorias: [],
        historico_profissional: [],
      };
      mocked(alunoSvc.buscarPerfilAluno).mockResolvedValue(perfil as any);

      // Act
      const res = await request(app).get('/alunos/1/perfil');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(perfil);
    });
  });

  // ==========================================================================
  // ENTREGAS (subrota de alunos)
  // ==========================================================================
  describe('/alunos/:id/entregas', () => {
    it('GET /alunos/:id/entregas retorna 200 com lista', async () => {
      // Arrange
      const entregas = [
        { id_aluno: 1, id_atividade: 1, data_entrega: '2026-01-01' },
      ];
      mocked(entregaSvc.listarEntregas).mockResolvedValue(entregas as any);

      // Act
      const res = await request(app).get('/alunos/1/entregas');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(entregas);
    });

    it('POST /alunos/:id/entregas retorna 201 com a entrega criada', async () => {
      // Arrange
      const criada = {
        id_aluno: 1,
        id_atividade: 5,
        data_entrega: '2026-01-01',
      };
      mocked(entregaSvc.registrarEntrega).mockResolvedValue(criada as any);

      // Act
      const res = await request(app)
        .post('/alunos/1/entregas')
        .send({ id_atividade: 5, data_entrega: '2026-01-01' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criada);
    });
  });

  // ==========================================================================
  // HISTORICO PROFISSIONAL (controller usa repos direto, nao service)
  // ==========================================================================
  describe('/alunos/:id/historico', () => {
    it('GET /alunos/:id/historico retorna 200 com lista de historico', async () => {
      // Arrange — aluno ativo + lista de historico vinda do repo
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        id_mentor: null,
        ativo: true,
      } as any);
      const lista = [
        { id_historico: 1, cargo: 'Dev', empresa: 'X', data_inicio: '2025-01-01', data_fim: null, id_usuario: 1 },
      ];
      mocked(historicoRepo.findAllByAluno).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/alunos/1/historico');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('POST /alunos/:id/historico retorna 201 com o registro criado', async () => {
      // Arrange
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        id_mentor: null,
        ativo: true,
      } as any);
      const criado = {
        id_historico: 9,
        cargo: 'Estagiario',
        empresa: 'Acme',
        data_inicio: '2026-01-01',
        data_fim: null,
        id_usuario: 1,
      };
      mocked(historicoRepo.create).mockResolvedValue(criado as any);

      // Act
      const res = await request(app)
        .post('/alunos/1/historico')
        .send({ cargo: 'Estagiario', empresa: 'Acme', data_inicio: '2026-01-01' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // MENTORES
  // ==========================================================================
  describe('/mentores', () => {
    it('GET /mentores retorna 200 com lista', async () => {
      // Arrange
      const lista = [{ id_usuario: 1, especialidade: 'X', ativo: true }];
      mocked(mentorSvc.listarMentores).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/mentores');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /mentores/:id retorna 200 com o mentor', async () => {
      // Arrange
      const mentor = { id_usuario: 1, ativo: true };
      mocked(mentorSvc.buscarMentor).mockResolvedValue(mentor as any);

      // Act
      const res = await request(app).get('/mentores/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mentor);
    });

    it('POST /mentores retorna 201 com o mentor criado', async () => {
      // Arrange
      const criado = { id_usuario: 5, especialidade: 'Dados', ativo: true };
      mocked(mentorSvc.criarMentor).mockResolvedValue(criado as any);

      // Act
      const res = await request(app)
        .post('/mentores')
        .send({ especialidade: 'Dados', tipo_vinculo: 'voluntario', disponibilidade: 'manha' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // MENTORIAS
  // ==========================================================================
  describe('/mentorias', () => {
    it('GET /mentorias retorna 200 com lista', async () => {
      // Arrange
      const lista = [
        { id_mentoria: 1, formato: 'online', tema: 'X', duracao: 60, data: '2026-01-01T10:00:00Z' },
      ];
      mocked(mentoriaSvc.listarMentorias).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/mentorias');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /mentorias/:id retorna 200 com a mentoria', async () => {
      // Arrange
      const mentoria = { id_mentoria: 1, formato: 'online', tema: 'X' };
      mocked(mentoriaSvc.buscarMentoria).mockResolvedValue(mentoria as any);

      // Act
      const res = await request(app).get('/mentorias/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mentoria);
    });

    it('POST /mentorias retorna 201 com a mentoria criada', async () => {
      // Arrange
      const criada = { id_mentoria: 10, formato: 'online', tema: 'X', duracao: 60, data: '2026-01-01T10:00:00Z' };
      mocked(mentoriaSvc.criarMentoria).mockResolvedValue(criada as any);

      // Act
      const res = await request(app)
        .post('/mentorias')
        .send({
          formato: 'online',
          tema: 'X',
          duracao: 60,
          data: '2026-01-01T10:00:00Z',
          id_mentor: 1,
          id_aluno: 1,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criada);
    });
  });

  // ==========================================================================
  // PROGRAMAS
  // ==========================================================================
  describe('/programas', () => {
    it('GET /programas retorna 200 com lista', async () => {
      // Arrange
      const lista = [{ id_programa: 1, titulo: 'P', inicio: '2026-01-01', fim: '2026-12-31' }];
      mocked(programaSvc.listarProgramas).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/programas');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /programas/:id retorna 200 com o programa', async () => {
      // Arrange
      const programa = { id_programa: 1, titulo: 'P', inicio: '2026-01-01', fim: '2026-12-31' };
      mocked(programaSvc.buscarPrograma).mockResolvedValue(programa as any);

      // Act
      const res = await request(app).get('/programas/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(programa);
    });

    it('POST /programas retorna 201 com o programa criado', async () => {
      // Arrange
      const criado = { id_programa: 7, titulo: 'Novo', inicio: '2026-01-01', fim: '2026-12-31' };
      mocked(programaSvc.criarPrograma).mockResolvedValue(criado as any);

      // Act
      const res = await request(app)
        .post('/programas')
        .send({ titulo: 'Novo', inicio: '2026-01-01', fim: '2026-12-31' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // EVENTOS
  // ==========================================================================
  describe('/eventos', () => {
    it('GET /eventos retorna 200 com lista', async () => {
      // Arrange
      const lista = [{ id_evento: 1, nome: 'E', data: '2026-06-01T10:00:00Z', local: 'L' }];
      mocked(eventoSvc.listarEventos).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/eventos');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /eventos/:id retorna 200 com o evento', async () => {
      // Arrange
      const evento = { id_evento: 1, nome: 'E', data: '2026-06-01T10:00:00Z', local: 'L' };
      mocked(eventoSvc.buscarEvento).mockResolvedValue(evento as any);

      // Act
      const res = await request(app).get('/eventos/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(evento);
    });

    it('POST /eventos retorna 201 com o evento criado', async () => {
      // Arrange
      const criado = { id_evento: 5, nome: 'Workshop', data: '2026-06-01T10:00:00Z', local: 'Auditorio' };
      mocked(eventoSvc.criarEvento).mockResolvedValue(criado as any);

      // Act
      const res = await request(app)
        .post('/eventos')
        .send({ nome: 'Workshop', data: '2026-06-01T10:00:00Z', local: 'Auditorio' });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // INDICADORES
  // ==========================================================================
  describe('/indicadores', () => {
    it('GET /indicadores retorna 200 com lista', async () => {
      // Arrange
      const lista = [{ id_indicador: 1, nome: 'Engajamento', descricao: 'd', id_programa: 1 }];
      mocked(indicadorSvc.listarIndicadores).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/indicadores');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /indicadores/:id retorna 200 com o indicador', async () => {
      // Arrange
      const ind = { id_indicador: 1, nome: 'Engajamento', descricao: 'd', id_programa: 1 };
      mocked(indicadorSvc.buscarIndicador).mockResolvedValue(ind as any);

      // Act
      const res = await request(app).get('/indicadores/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(ind);
    });

    it('POST /indicadores retorna 201 com o indicador criado', async () => {
      // Arrange
      const criado = { id_indicador: 3, nome: 'X', descricao: 'd', id_programa: 1 };
      mocked(indicadorSvc.criarIndicador).mockResolvedValue(criado as any);

      // Act
      const res = await request(app)
        .post('/indicadores')
        .send({ nome: 'X', descricao: 'd', id_programa: 1 });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });

  // ==========================================================================
  // AVALIACOES
  // ==========================================================================
  describe('/avaliacoes', () => {
    it('GET /avaliacoes retorna 200 com lista', async () => {
      // Arrange
      const lista = [
        { id_avaliacao: 1, nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 },
      ];
      mocked(avaliacaoSvc.listarAvaliacoes).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/avaliacoes');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /avaliacoes/:id retorna 200 com a avaliacao', async () => {
      // Arrange
      const av = { id_avaliacao: 1, nota: 5, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 };
      mocked(avaliacaoSvc.buscarAvaliacao).mockResolvedValue(av as any);

      // Act
      const res = await request(app).get('/avaliacoes/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(av);
    });

    it('POST /avaliacoes retorna 201 com a avaliacao criada', async () => {
      // Arrange
      const criada = { id_avaliacao: 2, nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 };
      mocked(avaliacaoSvc.criarAvaliacao).mockResolvedValue(criada as any);

      // Act
      const res = await request(app)
        .post('/avaliacoes')
        .send({ nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criada);
    });
  });

  // ==========================================================================
  // ATIVIDADES
  // ==========================================================================
  describe('/atividades', () => {
    it('GET /atividades retorna 200 com lista', async () => {
      // Arrange
      const lista = [{ id_atividade: 1, titulo: 'A', status: 'aberta', id_programa: 1 }];
      mocked(atividadeSvc.listarAtividades).mockResolvedValue(lista as any);

      // Act
      const res = await request(app).get('/atividades');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('GET /atividades/:id retorna 200 com a atividade', async () => {
      // Arrange
      const at = { id_atividade: 1, titulo: 'A', status: 'aberta', id_programa: 1 };
      mocked(atividadeSvc.buscarAtividade).mockResolvedValue(at as any);

      // Act
      const res = await request(app).get('/atividades/1');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(at);
    });

    it('POST /atividades retorna 201 com a atividade criada', async () => {
      // Arrange
      const criada = { id_atividade: 3, titulo: 'Nova', status: 'aberta', id_programa: 1 };
      mocked(atividadeSvc.criarAtividade).mockResolvedValue(criada as any);

      // Act
      const res = await request(app)
        .post('/atividades')
        .send({ titulo: 'Nova', status: 'aberta', id_programa: 1 });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criada);
    });
  });

  // ==========================================================================
  // IMPORTACAO
  // ==========================================================================
  describe('/importacao/alunos', () => {
    it('POST /importacao/alunos retorna 200 com importacao completa', async () => {
      // Arrange
      mocked(importacaoSvc.importarAlunos).mockResolvedValue({
        importados: 3,
        ignorados: 0,
        conflitos: [],
      });

      // Act — envia um buffer CSV minimalista como multipart/form-data
      const res = await request(app)
        .post('/importacao/alunos')
        .attach(
          'arquivo',
          Buffer.from('nome,email,senha,cpf\nA,a@x.com,1,1\n'),
          { filename: 'alunos.csv', contentType: 'text/csv' },
        );

      // Assert — quando nao ha conflitos, o controller retorna o resultado completo
      // (importados, ignorados, conflitos) com status 200.
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ importados: 3, ignorados: 0, conflitos: [] });
    });
  });

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  describe('/dashboard', () => {
    it('GET /dashboard retorna 200 com agregados', async () => {
      // Arrange
      const agregado = {
        total_alunos_ativos: 42,
        taxa_empregabilidade: 0.73,
        alunos_por_programa: [
          { id_programa: 1, nome_programa: 'P1', total_alunos: 12 },
        ],
      };
      mocked(dashboardSvc.getDashboard).mockResolvedValue(agregado as any);

      // Act
      const res = await request(app).get('/dashboard');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual(agregado);
    });
  });

  // ==========================================================================
  // ACOMPANHA
  // ==========================================================================
  describe('/acompanha', () => {
    it('POST /acompanha retorna 201 com o vinculo criado', async () => {
      // Arrange
      const criado = { id_mentor: 1, id_aluno: 2, id_programa: 3 };
      mocked(acompanhaSvc.criarAcompanha).mockResolvedValue(criado as any);

      // Act
      const res = await request(app).post('/acompanha').send(criado);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toEqual(criado);
    });
  });
});
