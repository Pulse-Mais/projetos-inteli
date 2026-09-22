export interface NovoEmprego {
  empresa: string;
  cargo: string;
  data_inicio: string;
  faixa_salarial: string;
}

export interface EmpregoAtivo {
  id_emprego: number;
  empresa: string;
  cargo: string;
  data_inicio: string;
}

export interface HistoricoEmprego {
  id_emprego: number;
  empresa: string;
  cargo: string;
  data_inicio: string;
  data_encerramento: string | null;
  data_termino?: string | null;
  faixa_salarial: string;
  ativo: boolean;
}
