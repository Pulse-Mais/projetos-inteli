import type { StatusInscricao } from './enums';

export interface Inscricao {
  id: number;
  id_jovem: number;
  id_programa: number;
  status_conclusao: StatusInscricao;
  data_matricula: Date;
  data_status: Date | null;
}

export type CriarInscricaoDTO = Omit<Inscricao, 'id'>;
