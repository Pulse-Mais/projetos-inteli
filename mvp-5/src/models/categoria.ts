import type { ClassificacaoPulse } from './enums';

export interface Categoria {
  id: number;
  id_jovem: number;
  /** Usuário responsável pela mudança. null na categoria inicial do cadastro. */
  id_usuario: number | null;
  categoria_adquirida: ClassificacaoPulse;
  /** Categoria imediatamente anterior. null na categoria inicial do cadastro. */
  categoria_anterior: ClassificacaoPulse | null;
  data_inclusao: Date;
}

export interface CategoriaCriacao {
  id_jovem: number;
  categoria_adquirida: ClassificacaoPulse;
  /** null na categoria inicial do cadastro. */
  id_usuario?: number | null;
  /** null na categoria inicial do cadastro. */
  categoria_anterior?: ClassificacaoPulse | null;
}
