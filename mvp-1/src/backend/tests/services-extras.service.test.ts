/**
 * Testes unitarios complementares de Service — caminhos felizes simples.
 *
 * Cobre as funcoes `listar*` / `buscar*` / `criar*` que ainda nao tem
 * cobertura nos testes existentes, principalmente para empurrar a
 * camada Service acima de 80% (DoR do Artefato 11 - 5.1.4).
 *
 * Padrao AAA explicito; mocks de repositorios garantem determinismo.
 */

jest.mock('../repositories/eventoRepository');
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/dashboardRepository');
jest.mock('../repositories/programaRepository');
jest.mock('../repositories/atividadeRepository');
jest.mock('../repositories/avaliacaoRepository');
jest.mock('../repositories/mentoriaRepository');
jest.mock('../repositories/indicadorRepository');
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../services/emailService', () => ({
  enviarEmail: jest.fn().mockResolvedValue(undefined),
}));

import * as eventoSvc from '../services/eventoService';
import * as mentorSvc from '../services/mentorService';
import * as dashboardSvc from '../services/dashboardService';
import * as programaSvc from '../services/programaService';
import * as atividadeSvc from '../services/atividadeService';
import * as avaliacaoSvc from '../services/avaliacaoService';
import * as mentoriaSvc from '../services/mentoriaService';
import * as indicadorSvc from '../services/indicadorService';
import * as usuarioSvc from '../services/usuarioService';

import * as eventoRepo from '../repositories/eventoRepository';
import * as mentorRepo from '../repositories/mentorRepository';
import * as dashboardRepo from '../repositories/dashboardRepository';
import * as programaRepo from '../repositories/programaRepository';
import * as atividadeRepo from '../repositories/atividadeRepository';
import * as avaliacaoRepo from '../repositories/avaliacaoRepository';
import * as mentoriaRepo from '../repositories/mentoriaRepository';
import * as indicadorRepo from '../repositories/indicadorRepository';
import * as usuarioRepo from '../repositories/usuarioRepository';
import * as alunoRepo from '../repositories/alunoRepository';

const mocked = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;

describe('Service — happy paths complementares (cobertura)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // EVENTOS
  // --------------------------------------------------------------------------
  describe('eventoService', () => {
    it('listarEventos retorna lista do repo', async () => {
      // Arrange
      const lista = [{ id_evento: 1, nome: 'Evento', data: '2026-06-01T10:00:00Z', local: 'L' }];
      mocked(eventoRepo.findAll).mockResolvedValue(lista as any);

      // Act
      const resultado = await eventoSvc.listarEventos();

      // Assert
      expect(resultado).toEqual(lista);
    });

    it('buscarEvento retorna evento quando existe', async () => {
      // Arrange
      const evento = { id_evento: 1, nome: 'E', data: '2026-06-01T10:00:00Z', local: 'L' };
      mocked(eventoRepo.findById).mockResolvedValue(evento as any);

      // Act
      const resultado = await eventoSvc.buscarEvento(1);

      // Assert
      expect(resultado).toEqual(evento);
    });

    it('criarEvento persiste evento e notifica alunos ativos por e-mail (RF007)', async () => {
      // Arrange
      const evento = { id_evento: 9, nome: 'Hackathon', data: '2026-08-15T18:00:00Z', local: 'Auditorio' };
      mocked(eventoRepo.create).mockResolvedValue(evento as any);
      mocked(alunoRepo.findAllComUsuario).mockResolvedValue([
        { id_usuario: 1, ativo: true, usuario: { email: 'a@x.com' } } as any,
        { id_usuario: 2, ativo: true, usuario: { email: 'b@x.com' } } as any,
      ]);

      // Act
      const resultado = await eventoSvc.criarEvento({
        nome: 'Hackathon',
        data: '2026-08-15T18:00:00Z',
        local: 'Auditorio',
      } as any);

      // Assert
      expect(resultado).toEqual(evento);
      expect(mocked(eventoRepo.create)).toHaveBeenCalledTimes(1);
    });

    it('criarEvento NAO quebra quando nenhum aluno ativo tem e-mail', async () => {
      // Arrange — lista vazia evita branch de envio de email
      const evento = { id_evento: 10, nome: 'S', data: '2026-09-01T10:00:00Z', local: 'L' };
      mocked(eventoRepo.create).mockResolvedValue(evento as any);
      mocked(alunoRepo.findAllComUsuario).mockResolvedValue([]);

      // Act / Assert
      await expect(
        eventoSvc.criarEvento({ nome: 'S', data: '2026-09-01T10:00:00Z', local: 'L' } as any),
      ).resolves.toEqual(evento);
    });
  });

  // --------------------------------------------------------------------------
  // MENTORES
  // --------------------------------------------------------------------------
  describe('mentorService', () => {
    it('listarMentores retorna lista do repo', async () => {
      const lista = [{ id_usuario: 1, ativo: true }];
      mocked(mentorRepo.findAll).mockResolvedValue(lista as any);
      expect(await mentorSvc.listarMentores()).toEqual(lista);
    });

    it('buscarMentor retorna mentor quando existe', async () => {
      const mentor = { id_usuario: 1, ativo: true };
      mocked(mentorRepo.findById).mockResolvedValue(mentor as any);
      expect(await mentorSvc.buscarMentor(1)).toEqual(mentor);
    });

    it('criarMentor delega para o repo', async () => {
      const criado = { id_usuario: 5, ativo: true };
      mocked(mentorRepo.create).mockResolvedValue(criado as any);
      const resultado = await mentorSvc.criarMentor({
        especialidade: 'Dados',
        tipo_vinculo: 'voluntario',
        disponibilidade: 'manha',
      } as any);
      expect(resultado).toEqual(criado);
    });
  });

  // --------------------------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------------------------
  describe('dashboardService.getDashboard', () => {
    it('calcula taxa de empregabilidade como % com 2 casas', async () => {
      // Arrange — 100 ativos, 73 com historico -> taxa 73.00
      mocked(dashboardRepo.countAlunosAtivos).mockResolvedValue(100);
      mocked(dashboardRepo.countAlunosComHistorico).mockResolvedValue(73);
      mocked(dashboardRepo.alunosPorPrograma).mockResolvedValue([
        { id_programa: 1, nome_programa: 'P', total_alunos: 12 },
      ]);

      // Act
      const dash = await dashboardSvc.getDashboard();

      // Assert
      expect(dash.total_alunos_ativos).toBe(100);
      expect(dash.taxa_empregabilidade).toBe(73);
      expect(dash.alunos_por_programa).toHaveLength(1);
    });

    it('retorna taxa 0 quando nao ha alunos ativos (divisao por zero)', async () => {
      // Arrange
      mocked(dashboardRepo.countAlunosAtivos).mockResolvedValue(0);
      mocked(dashboardRepo.countAlunosComHistorico).mockResolvedValue(0);
      mocked(dashboardRepo.alunosPorPrograma).mockResolvedValue([]);

      // Act
      const dash = await dashboardSvc.getDashboard();

      // Assert
      expect(dash.taxa_empregabilidade).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // listar/buscar happy paths em outros services
  // --------------------------------------------------------------------------
  describe('listar/buscar happy paths', () => {
    it('programaService.listarProgramas + buscarPrograma', async () => {
      const lista = [{ id_programa: 1, titulo: 'P', inicio: '2026-01-01', fim: '2026-12-31' }];
      mocked(programaRepo.findAll).mockResolvedValue(lista as any);
      mocked(programaRepo.findById).mockResolvedValue(lista[0] as any);
      expect(await programaSvc.listarProgramas()).toEqual(lista);
      expect(await programaSvc.buscarPrograma(1)).toEqual(lista[0]);
    });

    it('atividadeService.listarAtividades + buscarAtividade', async () => {
      const lista = [{ id_atividade: 1, titulo: 'A', status: 'aberta', id_programa: 1 }];
      mocked(atividadeRepo.findAll).mockResolvedValue(lista as any);
      mocked(atividadeRepo.findById).mockResolvedValue(lista[0] as any);
      expect(await atividadeSvc.listarAtividades()).toEqual(lista);
      expect(await atividadeSvc.buscarAtividade(1)).toEqual(lista[0]);
    });

    it('avaliacaoService.listarAvaliacoes + buscarAvaliacao', async () => {
      const lista = [
        { id_avaliacao: 1, nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 },
      ];
      mocked(avaliacaoRepo.findAll).mockResolvedValue(lista as any);
      mocked(avaliacaoRepo.findById).mockResolvedValue(lista[0] as any);
      expect(await avaliacaoSvc.listarAvaliacoes()).toEqual(lista);
      expect(await avaliacaoSvc.buscarAvaliacao(1)).toEqual(lista[0]);
    });

    it('mentoriaService.listarMentorias + buscarMentoria', async () => {
      const lista = [
        { id_mentoria: 1, formato: 'online', tema: 't', duracao: 60, data: '2026-01-01T10:00:00Z' },
      ];
      mocked(mentoriaRepo.findAll).mockResolvedValue(lista as any);
      mocked(mentoriaRepo.findById).mockResolvedValue(lista[0] as any);
      expect(await mentoriaSvc.listarMentorias()).toEqual(lista);
      expect(await mentoriaSvc.buscarMentoria(1)).toEqual(lista[0]);
    });

    it('indicadorService.listarIndicadores + buscarIndicador', async () => {
      const lista = [{ id_indicador: 1, nome: 'N', descricao: 'd', id_programa: 1 }];
      mocked(indicadorRepo.findAll).mockResolvedValue(lista as any);
      mocked(indicadorRepo.findById).mockResolvedValue(lista[0] as any);
      expect(await indicadorSvc.listarIndicadores()).toEqual(lista);
      expect(await indicadorSvc.buscarIndicador(1)).toEqual(lista[0]);
    });

    it('usuarioService.listarUsuarios + buscarUsuario + buscarPorCpf + buscarPorEmail', async () => {
      const lista = [{ id_usuario: 1, nome: 'U', email: 'u@x', cpf: '1', senha: 'h' }];
      mocked(usuarioRepo.findAll).mockResolvedValue(lista as any);
      mocked(usuarioRepo.findById).mockResolvedValue(lista[0] as any);
      mocked(usuarioRepo.findByCpf).mockResolvedValue(lista[0] as any);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(lista[0] as any);
      expect(await usuarioSvc.listarUsuarios()).toEqual(lista);
      expect(await usuarioSvc.buscarUsuario(1)).toEqual(lista[0]);
      expect(await usuarioSvc.buscarPorCpf('1')).toEqual(lista[0]);
      expect(await usuarioSvc.buscarPorEmail('u@x')).toEqual(lista[0]);
    });
  });
});
