export type StatusTurma = 'ativa' | 'encerrada' | 'suspensa';

export interface DadosTurma {
  nome_turma: string;
  data_inicio: string;
  data_fim: string;
  id_coordenador: number;
  capacidade?: number | null;
  descricao?: string | null;
  status?: StatusTurma;
}
