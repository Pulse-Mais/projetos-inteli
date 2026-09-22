export interface Psicologo {
  rm: number;
  nome: string;
  cargo?: string;
  email?: string;
}

export interface AlunoAtendido {
  ra: number;
  nome: string;
  status: boolean | string;
  id_turma: number;
  nome_turma?: string;
}

export interface FiltrosAlunosAtendidos {
  busca?: string;
  id_turma?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

export interface RegistrarProntuario {
  info_simplificada: string;
  observacoes?: string;
  data: string;
}

export interface Prontuario {
  id_relatorio: number;
  info_simplificada: string;
  observacoes: string;
  data: string;
}

export interface AtualizarProntuario {
  info_simplificada?: string;
  observacoes?: string;
}

export interface AtualizarStatusAtendimento {
  status: string;
}
