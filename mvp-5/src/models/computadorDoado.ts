export interface ComputadorDoado {
  id: number;
  id_jovem: number;
  data_doacao: string;
  data_devolucao: string | null;
  modelo: string;
}

export interface CriarComputadorDoadoDTO {
  id_jovem: number;
  data_doacao: string;
  data_devolucao?: string | null;
  modelo: string;
}