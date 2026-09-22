export interface Evento {
  id: number;
  nome: string;
  data: Date;
  descricao: string | null;
}

export interface EventoResumo extends Evento {
  total_inscritos: number;
  taxa_presenca: number;
}

export interface CriarEventoDTO {
  nome: string;
  data: string | Date;
  descricao?: string | null;
}

export interface AtualizarEventoDTO {
  nome?: string;
  data?: string | Date;
  descricao?: string | null;
}

export interface EventoFiltros {
  busca?: string;
  data?: string;
}