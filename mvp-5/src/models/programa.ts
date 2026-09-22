export interface Programa {
  id: number;
  nome: string;
  descricao: string | null;
  data_inicio: Date;
  data_fim: Date | null;
}

export type CriarProgramaDTO = Omit<Programa, 'id'>;
export type AtualizarProgramaDTO = Partial<CriarProgramaDTO>;
