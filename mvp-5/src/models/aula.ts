export interface Aula {
  id: number;
  id_programa: number;
  nome: string;
  data: string | Date;
}

export interface CriarAulaDTO {
  id_programa: number;
  nome: string;
  data: string | Date;
}

export interface AtualizarAulaDTO {
  id_programa?: number;
  nome?: string;
  data?: string | Date;
}

export interface AulaFiltros {
  id_programa?: number;
  busca?: string;
  data?: string;
}
