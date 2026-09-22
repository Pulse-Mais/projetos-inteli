import { NotFoundError, ValidationError } from '../errors/AppError';
import type {
  AtualizarEventoDTO,
  CriarEventoDTO,
  Evento,
  EventoFiltros,
  EventoResumo,
} from '../models/evento';
import * as eventoRepo from '../repositories/eventoRepository';

function validarId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('id deve ser um inteiro positivo');
  }
}

function validarData(data: string | Date): void {
  if (!data || Number.isNaN(new Date(data).getTime())) {
    throw new ValidationError('data deve ser uma data valida');
  }
}

export async function listar(
  filtros: EventoFiltros
): Promise<EventoResumo[]> {
  if (filtros.data) validarData(filtros.data);
  return eventoRepo.listar(filtros);
}

export async function buscarPorId(id: number): Promise<EventoResumo> {
  validarId(id);
  const evento = await eventoRepo.buscarPorId(id);
  if (!evento) throw new NotFoundError('evento');
  return evento;
}

export async function criar(dados: CriarEventoDTO): Promise<Evento> {
  if (!dados.nome?.trim()) throw new ValidationError('nome e obrigatorio');
  validarData(dados.data);
  return eventoRepo.criar(dados);
}

export async function atualizar(
  id: number,
  dados: AtualizarEventoDTO
): Promise<Evento> {
  await buscarPorId(id);
  if (dados.nome !== undefined && !dados.nome.trim()) {
    throw new ValidationError('nome nao pode ser vazio');
  }
  if (dados.data !== undefined) validarData(dados.data);

  const evento = await eventoRepo.atualizar(id, dados);
  if (!evento) throw new NotFoundError('evento');
  return evento;
}

export async function remover(id: number): Promise<void> {
  validarId(id);
  if (!(await eventoRepo.remover(id))) throw new NotFoundError('evento');
}
