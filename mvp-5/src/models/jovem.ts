import type { ClassificacaoPulse, StatusGlobal } from './enums';

export interface Jovem {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  data_nascimento: Date | null;
  endereco: string | null;
  genero: string | null;
  renda_inicial: number | null;
  categoria_atual: ClassificacaoPulse;
  status_global: StatusGlobal | null;
  criado_em: Date;
  atualizado_em: Date | null;
}

export interface JovemCriacao {
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  data_nascimento?: string | null;  // formato DD/MM/AAAA recebido do request (RN04)
  endereco?: string | null;
  genero?: string | null;
  renda_inicial?: number | null;
}

export interface JovemAtualizacao {
  nome?: string;
  email?: string;
  telefone?: string | null;
  endereco?: string | null;
  genero?: string | null;
  data_nascimento?: string | null;  // formato DD/MM/AAAA recebido do request (RN04)
  // renda_inicial excluída intencionalmente — campo imutável após criação (RN05).
  // Para registrar nova renda, use POST /jovens/:id/empregabilidade.
  categoria_atual?: ClassificacaoPulse;
  status_global?: StatusGlobal | null;
}

export interface JovemFiltros {
  categoria?: ClassificacaoPulse;
  status_global?: StatusGlobal;
  programa?: number;
}

export interface PontoJornada {
  categoria: string;
  data_inclusao: string;
  status: 'concluido' | 'em_andamento' | 'futuro';
}

export interface JovemPerfilCompleto {
  jovem: Jovem;
  categorias: unknown[];
  empregabilidades: unknown[];
  ensinoSuperior: unknown[];
  registros: unknown[];
  programaAtual: unknown | null;
  taxaFrequencia: number;
  taxaMentorias: number;
  pontos_fortes: string[];
  pontos_atencao: string[];
  jornada: PontoJornada[];
}
