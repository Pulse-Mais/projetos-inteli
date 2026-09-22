// Importa as definições de tipos para aceitar somente valores válidos
import type { TipoRegistro, Visibilidade } from './enums';

// Modelo de dados completo de um registro de acompanhamento
export interface RegistroAcompanhamento {
  id: number;
  id_jovem: number;
  id_autor: number;
  tipo_registro: TipoRegistro;
  visibilidade: Visibilidade;
  conteudo: string;
  data_registro: Date;
}

// Interface de entrada de dados para a criação de um novo registro
export interface CriarRegistroInput {
  id_autor: number;
  tipo_registro: TipoRegistro;
  visibilidade?: Visibilidade;
  conteudo: string;
}

// Interface de entrada de dados para a atualização de um registro existente
export interface AtualizarRegistroInput {
  tipo_registro?: TipoRegistro;
  visibilidade?: Visibilidade;
  conteudo?: string;
}