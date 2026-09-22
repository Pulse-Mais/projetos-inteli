import * as sessaoRepo from '../repositories/sessaoMentoriaRepository';
import type {
  SessaoMentoria,
  CriarSessaoMentoriaDTO,
  AtualizarSessaoMentoriaDTO,
} from '../models/sessaoMentoria';
import { NotFoundError } from '../errors/AppError';
import { validarPerfil } from '../helpers/validarPerfil';

export async function listarPorMentor(id_mentor: number): Promise<SessaoMentoria[]> {
  return sessaoRepo.buscarPorMentor(id_mentor);
}

export async function criarSessao(
  dados: CriarSessaoMentoriaDTO,
  idUsuario: number
): Promise<SessaoMentoria> {
  await validarPerfil(idUsuario, ['Mentor']);
  return sessaoRepo.criar(dados);
}

export async function atualizarSessao(
  id: number,
  dados: AtualizarSessaoMentoriaDTO,
  idUsuario: number
): Promise<SessaoMentoria> {
  await validarPerfil(idUsuario, ['Mentor']);
  const sessao = await sessaoRepo.buscarPorId(id);
  if (!sessao) throw new NotFoundError('sessão de mentoria');
  const atualizada = await sessaoRepo.atualizar(id, dados);
  if (!atualizada) throw new NotFoundError('sessão de mentoria');
  return atualizada;
}
