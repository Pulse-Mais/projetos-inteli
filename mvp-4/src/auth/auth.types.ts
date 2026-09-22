import { Request } from 'express';

export type PerfilAutenticado = 'aluno' | 'coordenadora' | 'gestor' | 'psicologa';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilAutenticado;
}

export interface RequisicaoAutenticada extends Request {
  usuario?: UsuarioAutenticado;
}
