// Espelha a tabela frequencia_aula do banco.
// id_aula é FK NOT NULL para a tabela aula — o nome da aula vem via JOIN.
export interface FrequenciaAula {
  id: number;
  id_jovem: number;
  id_aula: number;
  data: Date;
  presente: boolean;
}

export interface CriarFrequenciaAulaDTO {
  id_jovem: number;
  id_aula: number;
  data: Date;
  presente: boolean;
  aula: string;
}