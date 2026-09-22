export type PerfilUsuario =
  | 'Gestao'
  | 'Coordenacao'
  | 'Psicologo'
  | 'Mentor'
  | 'Aluno';

export type ClassificacaoPulse =
  | 'Conectado'
  | 'Capacitado'
  | 'Transformado';

export type StatusGlobal =
  | 'Ativo'
  | 'Formado'
  | 'Evadido'
  | 'Inativo';

export type StatusInscricao =
  | 'Em andamento'
  | 'Concluido'
  | 'Evadido';

export type SituacaoEmpregabilidade =
  | 'Empregado'
  | 'Procurando';

export type TipoContrato =
  | 'Jovem Aprendiz'
  | 'Estagio'
  | 'Efetivado';

export type SituacaoEnsinoSuperior =
  | 'Concluido'
  | 'Cursando'
  | 'Não possui';

export type TipoRegistro =
  | 'Acompanhamento_Psicologico'
  | 'Mentoria'
  | 'Atendimento_Equipe';

export type Visibilidade =
  | 'Publico_Equipe'
  | 'Restrito_Psicologia';