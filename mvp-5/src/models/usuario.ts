import type { PerfilUsuario } from './enums';

export interface Usuario {
  id: number;
  id_jovem: number | null;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  criado_em: Date;
  // Campos de perfil profissional (Mentor / Psicólogo)
  telefone?: string | null;
  cidade?: string | null;
  area_atuacao?: string | null;
  disponibilidade?: string | null;
  biografia?: string | null;
  crp?: string | null;
  especializacao?: string | null;
  abordagem?: string | null;
  horario_atendimento?: string | null;
}

export interface CriarUsuarioInput {
  id_jovem?: number | null;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface AtualizarUsuarioInput {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuario;
  telefone?: string | null;
  cidade?: string | null;
  area_atuacao?: string | null;
  disponibilidade?: string | null;
  biografia?: string | null;
  crp?: string | null;
  especializacao?: string | null;
  abordagem?: string | null;
  horario_atendimento?: string | null;
}