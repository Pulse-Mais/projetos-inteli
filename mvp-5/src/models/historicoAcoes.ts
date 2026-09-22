// Modelo de dados do histórico de ações refletindo seu armazenamento no banco
export interface HistoricoAcoes {
  id: number;
  id_usuario: number;
  id_jovem_afetado: number | null;
  acao: string;
  tabela_afetada: string;
  valor_anterior: string | null;
  data_hora: Date;
}

// Interface de entrada de dados no momento registrar uma nova ação no histórico
export interface RegistrarAcaoInput {
  id_usuario: number;
  id_jovem_afetado?: number | null;
  acao: string;
  tabela_afetada: string;
  valor_anterior?: string | null;
}