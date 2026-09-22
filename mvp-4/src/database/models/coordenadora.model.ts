export interface Coordenadora {
  rm: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  email: string;
}

export interface AlunoCoordenadora {
  ra: number;
  nome: string;
  cpf?: string;
  foto?: string;
  date_nasc?: string;
  genero?: string;
  email_primario?: string;
  email_secundario?: string;
  tel_primario?: string;
  tel_secundario?: string;
  status: string;
  data_ingresso?: string;
  data_conclusao?: string;
  categoria?: string;
  nivel_formacao: string;
  ex_aluno?: boolean;
  id_turma: number;
  frequencia?: boolean;
}


export interface AlunosFiltros {
  status?: string;
  id_turma?: number;
  genero?: string;
  categoria?: string;
  nivel_formacao?: string;
  ex_aluno?: boolean;
}

export interface RegistrarFrequencia {
  id_aula: number;
  data: string;
  frequencia: boolean;
}

export interface AtualizarFrequencia {
  frequencia: boolean;
}

export interface RegistrarObservacao {
  info_simplificada: string;
  observacoes?: string;
  data: string;
}

export interface RegistrarEvento {
  tema: string;
  sede: string;
  data: string;
  categoria: string;
  descricao?: string;
}

export interface ComunicadoCoordenadora {
  id_comunicado: number;
  tema: string;
  sede: string;
  data: string;
  tipo: string;
  descricao?: string;
}

export interface Relatorio {
  id_relatorio: number;
  info_simplificada: string;
  observacoes?: string;
  data: string;
  id_aluno: number;
  id_psicologo: number;
}
