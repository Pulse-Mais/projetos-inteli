import * as repo from '../repositories/usuarioRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import type {
  Usuario,
  CriarUsuarioInput,
  AtualizarUsuarioInput
} from '../models/usuario';
import type { PerfilUsuario } from '../models/enums';

const PERFIS_VALIDOS: PerfilUsuario[] = [
  'Gestao',
  'Coordenacao',
  'Psicologo',
  'Mentor',
  'Aluno'
];

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function buscarPorId(id: number): Promise<Usuario> {
  const usuario = await repo.buscarPorId(id);
  if (!usuario) throw new NotFoundError('usuário');
  return usuario;
}

export async function listarTodos(): Promise<Usuario[]> {
  return repo.listarTodos();
}

export async function criar(input: CriarUsuarioInput): Promise<Usuario> {
  if (!input.nome || input.nome.trim().length < 2) {
    throw new BadRequestError('nome inválido');
  }
  if (!validarEmail(input.email)) {
    throw new BadRequestError('email inválido');
  }
  if (!PERFIS_VALIDOS.includes(input.perfil)) {
    throw new BadRequestError('perfil inválido');
  }
  if (input.perfil === 'Aluno' && !input.id_jovem) {
    throw new BadRequestError('usuário com perfil Aluno requer id_jovem');
  }
  return repo.criar(input);
}

export async function atualizar(
  id: number,
  input: AtualizarUsuarioInput
): Promise<Usuario> {
  if (input.email !== undefined && !validarEmail(input.email)) {
    throw new BadRequestError('email inválido');
  }
  if (input.perfil !== undefined && !PERFIS_VALIDOS.includes(input.perfil)) {
    throw new BadRequestError('perfil inválido');
  }

  const atualizado = await repo.atualizar(id, input);
  if (!atualizado) throw new NotFoundError('usuário');
  return atualizado;
}

export async function remover(id: number): Promise<void> {
  const removido = await repo.remover(id);
  if (!removido) throw new NotFoundError('usuário');
}