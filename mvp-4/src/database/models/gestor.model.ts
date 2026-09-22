export interface Gestor {
  rm: number;
  nome: string;
  email: string;
} 

export interface AlunoGestor {
  ra: number;
  nome: string;
  status: string;
  categoria?: string;
  nivel_formacao: string;
  idTurma: number;
  frequencia: boolean;
  empregabilidade: {
    empresa: string;
    cargo: string;
    faixa_salarial: string;
  } | null;
}

export interface AlunoDetalhadoGestor {
  ra: number;
  nome: string;
  foto: string | null;
  idTurma: number | null;
  status: string;
  genero: string;
  email_primario: string;
  email_secundario?: string | null;
  tel_primario: string;
  tel_secundario?: string | null;
  cep: string | null;
  endereco: string | null;
  renda_familiar: string | number | null;
  empregabilidade: {
    empresa: string;
    cargo: string;
    faixa_salarial: string;
    nivel_formacao: string | null;
  } | null;
}

export type DestinatariosComunicado = 'ativos' | 'ex-alunos' | 'todos';

export interface ComunicadoGestor {
  titulo: string;
  conteudo: string;
  destinatarios: DestinatariosComunicado;
  tipo?: string;
  enviado_por?: number;
}

export interface ComunicadoHistorico {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  tipo: string;
  destinatarios: DestinatariosComunicado;
  total_destinatarios: number;
  data_envio: Date | string;
  sede: string | null;
  data_acontecer: Date | string | null;
}

export interface AlunoDestinatarioComunicado {
  ra: number;
  nome: string;
  email_primario: string;
}

export interface ArquivoImportacaoCsv {
  originalname: string;
  mimetype?: string;
  buffer: Buffer;
}

export interface ConflitoImportacao {
  ra: number | null;
  motivo: string;
}

export interface ResultadoImportacaoCsv {
  importados: number;
  conflitos: ConflitoImportacao[];
  ignorados: number;
}

export interface RegistroHistoricoCsv {
  ra: number | null;
  nome: string;
  cpf: string;
  email_primario: string;
  tel_primario: string;
  genero: string;
  data_nasc: string;
  data_ingresso: string;
  categoria: string;
  status: boolean;
}

export interface AlunoConflitoImportacao {
  ra: number;
  cpf: string;
  email_primario: string;
}

export interface FiltrosAluno {
  idade_min?: number;
  idade_max?: number;
  empregabilidade?: string;
  id_turma?: number;
  eventos_min?: number;
  eventos_max?: number;
  genero?: string;
}
