import * as programaRepo from '../repositories/programaRepository';
import * as inscricaoRepo from '../repositories/inscricaoRepository';
import type { Programa, CriarProgramaDTO, AtualizarProgramaDTO } from '../models/programa';
import type { Inscricao } from '../models/inscricao';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';

export async function listar(): Promise<Programa[]> {
  return programaRepo.listarTodos();
}

export async function buscarPorId(id: number): Promise<Programa> {
  const programa = await programaRepo.buscarPorId(id);
  if (!programa) throw new NotFoundError('programa');
  return programa;
}

export async function criar(dados: CriarProgramaDTO): Promise<Programa> {
  if (!dados.nome?.trim()) throw new BadRequestError('nome é obrigatório');
  if (!dados.data_inicio) throw new BadRequestError('data_inicio é obrigatória');
  return programaRepo.criar(dados);
}

export async function atualizar(id: number, dados: AtualizarProgramaDTO): Promise<Programa> {
  await buscarPorId(id);
  const atualizado = await programaRepo.atualizar(id, dados);
  if (!atualizado) throw new NotFoundError('programa');
  return atualizado;
}

export async function listStudents(
  id_programa: number
): Promise<{ id_jovem: number; nome: string; status_conclusao: string }[]> {
  await buscarPorId(id_programa);
  return programaRepo.listarJovensInscritos(id_programa);
}

export async function listEvents(
  id_programa: number
): Promise<{ id: number; nome: string; data: Date }[]> {
  await buscarPorId(id_programa);
  return programaRepo.listarAulas(id_programa);
}

export async function inserirInscricao(
  id_jovem: number,
  body: { id_programa: number }
): Promise<Inscricao> {
  if (!body.id_programa) throw new BadRequestError('id_programa é obrigatório');
  await buscarPorId(body.id_programa);
  const existente = await inscricaoRepo.buscarPorJovemEPrograma(id_jovem, body.id_programa);
  if (existente) throw new ConflictError('jovem já inscrito neste programa');
  return inscricaoRepo.criar({
    id_jovem,
    id_programa: body.id_programa,
    status_conclusao: 'Em andamento',
    data_matricula: new Date(),
    data_status: null,
  });
}

export async function listarInscricoes(id_jovem: number): Promise<Inscricao[]> {
  return inscricaoRepo.buscarPorJovem(id_jovem);
}
