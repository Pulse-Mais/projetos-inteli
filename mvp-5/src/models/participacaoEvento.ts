export interface ParticipacaoEvento {
  id: number;
  id_jovem: number;
  id_evento: number;
  evento: string;
  data: Date;
  presente: boolean;
}

export interface CriarParticipacaoEventoDTO {
  id_jovem: number;
  id_evento: number;
  evento: string;
  data: Date;
  presente: boolean;
}