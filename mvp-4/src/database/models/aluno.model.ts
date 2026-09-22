export interface Aluno {
  ra: number;
  nome: string;
  cpf: string;
  foto: string;
  data_nasc: string;
  id_turma: number;
  status: string;
  genero: string;
  data_ingresso?: string;
  nivel_formacao?: string;
  categoria?: string | null;
  email_primario: string;
  email_secundario?: string;
  tel_primario: string;
  tel_secundario?: string;
  cep?: string | null;
  endereco?: string | null;
  renda_familiar?: string | number | null;
}

export type AtualizarAluno = Partial<Omit<Aluno, 'ra' | 'nome' | 'cpf'>>;
