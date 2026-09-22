export interface SessaoMentoria {
  id: number;
  id_jovem: number;
  id_mentor: number;
  data: Date;
  presente: boolean;
  avaliacao?: number | null;
  duracao_minutos?: number | null;
}

export interface VinculoMentoria {
  id: number;
  id_mentor: number;
  id_jovem: number;
  status_vinculo: string;
  data_inicio: Date;
  data_fim: Date | null;
}

export type CriarSessaoMentoriaDTO = Omit<SessaoMentoria, 'id'>;
export type AtualizarSessaoMentoriaDTO = Partial<Pick<SessaoMentoria, 'data' | 'presente' | 'avaliacao' | 'duracao_minutos'>>;
