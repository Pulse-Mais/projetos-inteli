import { NotFoundError, ValidationError } from '../errors/AppError';
import type {
  Aula,
  AulaFiltros,
  AtualizarAulaDTO,
  CriarAulaDTO,
} from '../models/aula';
import * as aulaRepo from '../repositories/aulaRepository';
import * as programaRepo from '../repositories/programaRepository';

function validarId(id: number, campo = 'id'): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`${campo} deve ser um inteiro positivo`);
  }
}

function validarData(data: string | Date, campo = 'data'): void {
  if (!data || Number.isNaN(new Date(data).getTime())) {
    throw new ValidationError(`${campo} deve ser uma data valida`);
  }
}

async function validarPrograma(idPrograma: number): Promise<void> {
  validarId(idPrograma, 'id_programa');
  if (!(await programaRepo.buscarPorId(idPrograma))) {
    throw new NotFoundError('programa');
  }
}

export async function listar(filtros: AulaFiltros): Promise<Aula[]> {
  if (filtros.id_programa !== undefined) {
    validarId(filtros.id_programa, 'id_programa');
  }
  if (filtros.data) validarData(filtros.data);
  return aulaRepo.listar(filtros);
}

export async function buscarPorId(id: number): Promise<Aula> {
  validarId(id);
  const aula = await aulaRepo.buscarPorId(id);
  if (!aula) throw new NotFoundError('aula');
  return aula;
}

export async function criar(dados: CriarAulaDTO): Promise<Aula> {
  if (!dados.nome?.trim()) throw new ValidationError('nome e obrigatorio');
  validarData(dados.data);
  await validarPrograma(dados.id_programa);
  return aulaRepo.criar(dados);
}

export async function atualizar(
  id: number,
  dados: AtualizarAulaDTO
): Promise<Aula> {
  await buscarPorId(id);
  if (dados.nome !== undefined && !dados.nome.trim()) {
    throw new ValidationError('nome nao pode ser vazio');
  }
  if (dados.data !== undefined) validarData(dados.data);
  if (dados.id_programa !== undefined) await validarPrograma(dados.id_programa);

  const aula = await aulaRepo.atualizar(id, dados);
  if (!aula) throw new NotFoundError('aula');
  return aula;
}

export async function remover(id: number): Promise<void> {
  validarId(id);
  if (!(await aulaRepo.remover(id))) throw new NotFoundError('aula');
}
