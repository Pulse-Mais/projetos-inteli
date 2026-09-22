export interface Anotacao {
  id_anotacoes: number;
  id_aluno: number;
  nome_autor: string;
  data: string;
  conteudo: string;
}

export interface NovaAnotacao {
  nome_autor: string;
  data?: string;
  conteudo: string;
}

export interface AtualizarAnotacao {
  nome_autor?: string;
  data?: string;
  conteudo?: string;
}
