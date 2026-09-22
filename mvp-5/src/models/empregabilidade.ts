import { SituacaoEmpregabilidade, TipoContrato } from './enums';

export interface Empregabilidade {
  id: number;
  id_jovem: number;
  situacao: SituacaoEmpregabilidade;
  vinculo: TipoContrato | null;
  empresa: string | null;
  area_atuacao: string | null;
  renda_atual: number | null;
  data_registro: Date;
  encerrado: number;          // smallint 0/1 no banco (não boolean)
  data_final: Date | null;
}
