import { pool } from '../db/pool';
import type {
  Jovem,
  JovemCriacao,
  JovemAtualizacao,
  JovemFiltros,
  JovemPerfilCompleto,
  PontoJornada,
} from '../models/jovem';
import * as jovemRepo from '../repositories/jovemRepository';
import * as categoriaRepo from '../repositories/categoriaRepository';
import * as frequenciaAulaRepo from '../repositories/frequenciaAulaRepository';
import * as registroRepo from '../repositories/registroAcompanhamentoRepository';
import * as sessaoMentoriaRepo from '../repositories/sessaoMentoriaRepository';
import * as empregabilidadeRepo from '../repositories/empregabilidadeRepository';
import * as ensinoSuperiorRepo from '../repositories/ensinoSuperiorRepository';
import type { Empregabilidade } from '../models/empregabilidade';
import type { EnsinoSuperior } from '../models/ensinoSuperior';
import * as auditoriaService from './auditoriaService';
import { NotFoundError, ConflictError, ValidationError } from '../errors/AppError';
import type { Categoria } from '../models/categoria';
import type { ClassificacaoPulse } from '../models/enums';
import { validarCpf } from '../helpers/validarCpf';
import { validarIdade } from '../helpers/calcularIdade';
import { parsearDataBr } from '../helpers/parsearDataBr';

export async function buscarPorId(id: number): Promise<Jovem> {
  const jovem = await jovemRepo.buscarPorId(id);
  if (!jovem) throw new NotFoundError('jovem');
  return jovem;
}

export async function listar(filtros: JovemFiltros): Promise<Jovem[]> {
  return jovemRepo.buscarComFiltros(filtros);
}

export async function criar(dados: JovemCriacao, idUsuario: number): Promise<Jovem> {
  // ── Campos obrigatórios (RN03) ───────────────────────────────────────────
  if (!dados.nome || dados.nome.trim() === '') {
    throw new ValidationError('nome é obrigatório');
  }
  if (!dados.email || dados.email.trim() === '') {
    throw new ValidationError('email é obrigatório');
  }
  if (!dados.telefone || dados.telefone.trim() === '') {
    throw new ValidationError('telefone é obrigatório');
  }

  // ── Unicidade de e-mail (RN01) ───────────────────────────────────────────
  const emailExiste = await jovemRepo.buscarPorEmail(dados.email);
  if (emailExiste) {
    throw new ConflictError('email já cadastrado');
  }

  // ── CPF: opcional, mas validado quando informado (RN03) ─────────────────
  if (dados.cpf && dados.cpf.trim() !== '') {
    validarCpf(dados.cpf);
    const cpfExiste = await jovemRepo.buscarPorCpf(dados.cpf);
    if (cpfExiste) {
      throw new ConflictError('cpf já cadastrado');
    }
  }

  // ── Formato DD/MM/AAAA e faixa etária 14–29 anos (RN04 + RN04b) ──────────
  let dataNascimentoIso: string | null = null;
  if (dados.data_nascimento && dados.data_nascimento.trim() !== '') {
    const dateObj = parsearDataBr(dados.data_nascimento);
    validarIdade(dateObj);
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    dataNascimentoIso = `${dateObj.getFullYear()}-${m}-${d}`;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const jovemCriado = await jovemRepo.inserir(
      { ...dados, data_nascimento: dataNascimentoIso },
      client
    );

    // Categoria inicial gerada pelo sistema — id_usuario null (RN06)
    await categoriaRepo.inserir(
      { id_jovem: jovemCriado.id, categoria_adquirida: 'Conectado', id_usuario: null, categoria_anterior: null },
      client
    );

    await client.query('COMMIT');

    auditoriaService.registrar({
      id_usuario: idUsuario,
      id_jovem_afetado: jovemCriado.id,
      acao: 'criou jovem',
      tabela_afetada: 'jovem',
      valor_anterior: null,
    });

    return jovemCriado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

export async function atualizar(
  id: number,
  dados: JovemAtualizacao,
  idUsuario: number
): Promise<Jovem> {
  const anterior = await jovemRepo.buscarPorId(id);
  if (!anterior) throw new NotFoundError('jovem');

  // ── Formato DD/MM/AAAA quando data_nascimento fornecida (RN04) ───────────
  let dadosProcessados = dados;
  if (dados.data_nascimento && dados.data_nascimento.trim() !== '') {
    const dateObj = parsearDataBr(dados.data_nascimento);
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    dadosProcessados = { ...dados, data_nascimento: `${dateObj.getFullYear()}-${m}-${d}` };
  }

  const atualizado = await jovemRepo.atualizar(id, dadosProcessados);
  if (!atualizado) throw new NotFoundError('jovem');

  // ── Histórico de categoria (RN07) ────────────────────────────────────────
  if (dados.categoria_atual !== undefined && dados.categoria_atual !== anterior.categoria_atual) {
    await categoriaRepo.inserir({
      id_jovem: id,
      id_usuario: idUsuario,
      categoria_adquirida: dados.categoria_atual,
      categoria_anterior: anterior.categoria_atual,
    });
  }

  auditoriaService.registrar({
    id_usuario: idUsuario,
    id_jovem_afetado: id,
    acao: 'atualizou jovem',
    tabela_afetada: 'jovem',
    valor_anterior: JSON.stringify(anterior),
  });

  return atualizado;
}

export async function remover(id: number, idUsuario: number): Promise<void> {
  const anterior = await jovemRepo.buscarPorId(id);
  if (!anterior) throw new NotFoundError('jovem');

  const removido = await jovemRepo.remover(id);
  if (!removido) throw new NotFoundError('jovem');

  auditoriaService.registrar({
    id_usuario: idUsuario,
    id_jovem_afetado: id,
    acao: 'removeu jovem',
    tabela_afetada: 'jovem',
    valor_anterior: JSON.stringify(anterior),
  });
}

export async function obterPerfilCompleto(
  id: number
): Promise<JovemPerfilCompleto> {
  const jovem = await jovemRepo.buscarPorId(id);
  if (!jovem) throw new NotFoundError('jovem');

  const [categorias, taxaFrequencia, programaAtual, empregabilidades, ensinoSuperior, registros, sessoes] =
    await Promise.all([
      categoriaRepo.listarPorJovem(id),
      obterTaxaFrequencia(id),
      obterProgramaAtual(id),
      obterHistoricoEmpregos(id),
      ensinoSuperiorRepo.buscarPorJovem(id),
      obterRegistros(id),
      sessaoMentoriaRepo.buscarPorJovem(id),
    ]);

  const totalSessoes    = sessoes.length;
  const sessoesPresente = sessoes.filter(s => s.presente).length;
  const taxaMentorias   = totalSessoes > 0 ? Math.round(sessoesPresente / totalSessoes * 100) : 0;

  const pontos_fortes: string[]  = [];
  const pontos_atencao: string[] = [];

  if (taxaFrequencia >= 80) pontos_fortes.push('Alta frequência nas aulas');
  else if (taxaFrequencia < 60) pontos_atencao.push('Frequência abaixo do esperado');

  if (taxaMentorias >= 75) pontos_fortes.push('Presença consistente nas mentorias');
  else if (totalSessoes > 0 && taxaMentorias < 60) pontos_atencao.push('Baixa adesão às sessões de mentoria');

  if (jovem.categoria_atual === 'Transformado') pontos_fortes.push('Atingiu nível Transformado');
  else if (jovem.categoria_atual === 'Capacitado') pontos_fortes.push('Progrediu para nível Capacitado');

  if (jovem.status_global === 'Evadido' || jovem.status_global === 'Inativo') {
    pontos_atencao.push(`Status: ${jovem.status_global}`);
  }

  const ORDEM_CAT = ['Conectado', 'Capacitado', 'Transformado'];
  const catsLista = categorias as Categoria[];

  const jornada: PontoJornada[] = ORDEM_CAT.map(cat => {
    const entrada = catsLista.find(c => c.categoria_adquirida === cat);
    const idx     = ORDEM_CAT.indexOf(cat);
    const atual   = ORDEM_CAT.indexOf(jovem.categoria_atual);
    const status: PontoJornada['status'] =
      idx < atual  ? 'concluido'    :
      idx === atual ? 'em_andamento' : 'futuro';
    return {
      categoria:    cat,
      data_inclusao: entrada?.data_inclusao ? new Date(entrada.data_inclusao).toISOString() : '',
      status,
    };
  });

  return {
    jovem,
    categorias,
    empregabilidades,
    ensinoSuperior,
    registros,
    programaAtual,
    taxaFrequencia,
    taxaMentorias,
    pontos_fortes,
    pontos_atencao,
    jornada,
  };
}

export async function obterProgramaAtual(idJovem: number): Promise<unknown | null> {
  // Integrar com inscricaoRepository e programaRepository (Pessoa 6) quando disponível.
  void idJovem;
  return null;
}

export async function obterTaxaFrequencia(idJovem: number): Promise<number> {
  return frequenciaAulaRepo.calcularTaxaPresenca(idJovem);
}

export async function obterHistoricoEmpregos(idJovem: number): Promise<Empregabilidade[]> {
  return empregabilidadeRepo.buscarPorJovem(idJovem);
}

export async function obterEnsinoSuperior(idJovem: number): Promise<EnsinoSuperior[]> {
  return ensinoSuperiorRepo.buscarPorJovem(idJovem);
}

/**
 * Lista registros de acompanhamento de um jovem.
 *
 * A filtragem por visibilidade depende do perfil do usuário consultando:
 *   - Psicologo vê todos (Publico_Equipe + Restrito_Psicologia)
 *   - Demais perfis veem apenas Publico_Equipe
 *
 * TODO: quando o middleware de auth da Pessoa 1 estiver pronto,
 * `apenasPublico` deve ser calculado a partir de req.user.perfil:
 *   const apenasPublico = req.user.perfil !== 'Psicologo';
 *
 * Por enquanto, sempre devolve apenas Publico_Equipe (mais restritivo
 * por segurança — evita vazar dados sensíveis enquanto auth não existe).
 */
export async function obterRegistros(idJovem: number): Promise<unknown[]> {
  const apenasPublico = true; // TODO: derivar do perfil do usuário logado
  return registroRepo.listarPorJovem(idJovem, apenasPublico);
}

/**
 * Muda a categoria de um jovem, registrando o histórico na tabela categoria.
 * RN07 — toda alteração de categoria deve gerar um registro de progressão.
 */
export async function mudarCategoria(
  idJovem: number,
  novaCategoria: ClassificacaoPulse,
  idUsuario: number
): Promise<Categoria> {
  const jovem = await jovemRepo.buscarPorId(idJovem);
  if (!jovem) throw new NotFoundError('jovem');

  // Insere registro de histórico com categoria anterior e usuário responsável (RN07)
  const registro = await categoriaRepo.inserir({
    id_jovem: idJovem,
    categoria_adquirida: novaCategoria,
    categoria_anterior: jovem.categoria_atual,
    id_usuario: idUsuario,
  });

  // Atualiza categoria_atual no perfil do jovem
  await jovemRepo.atualizar(idJovem, { categoria_atual: novaCategoria });

  auditoriaService.registrar({
    id_usuario: idUsuario,
    id_jovem_afetado: idJovem,
    acao: `mudou categoria para ${novaCategoria}`,
    tabela_afetada: 'categoria',
    valor_anterior: jovem.categoria_atual,
  });

  return registro;
}

/**
 * Lista o histórico de categorias de um jovem em ordem cronológica.
 */
export async function listarCategorias(idJovem: number): Promise<Categoria[]> {
  const jovem = await jovemRepo.buscarPorId(idJovem);
  if (!jovem) throw new NotFoundError('jovem');
  return categoriaRepo.listarPorJovem(idJovem);
}
