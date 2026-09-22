import { SituacaoEnsinoSuperior } from './enums';

export interface EnsinoSuperior {
  id: number;
  id_jovem: number;
  ingressou: number;
  situacao: SituacaoEnsinoSuperior | null;
  instituicao: string | null;
  data_registro: Date;
}
