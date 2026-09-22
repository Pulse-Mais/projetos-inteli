import bcrypt from 'bcryptjs';
import * as repo from '../repositories/alunoRepository';
import { CreateAlunoData, AlunoFiltros, PerfilAluno, Conquista } from '../repositories/alunoRepository';
import * as conquistaManualRepo from '../repositories/conquistaManualRepository';
import * as matriculaRepo from '../repositories/matriculaRepository';
import * as acompanhaRepo from '../repositories/acompanhaRepository';
import * as acompanhaSvc from './acompanhaService';
import * as usuarioRepo from '../repositories/usuarioRepository';
import * as usuarioSvc from './usuarioService';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/AppError';

/**
 * RF009: sem o parâmetro `ativo`, retorna apenas alunos ativos (default = true).
 * Para incluir ex-alunos o chamador deve passar explicitamente ativo=false.
 */
export async function listarAlunos(filtros: AlunoFiltros = {}) {
  // Regra de negócio RF009: sem o parâmetro `ativo`, retornar apenas alunos
  // ativos (default = true). Para ver ex-alunos, o cliente precisa passar
  // explicitamente ativo=false.
  const filtrosNormalizados: AlunoFiltros = {
    ...filtros,
    ativo: filtros.ativo === undefined ? true : filtros.ativo,
  };
  return repo.findAllComUsuario(filtrosNormalizados);
}

/** Retorna o aluno ativo pelo id. Lança NotFoundError se não existir ou estiver inativo. */
export async function buscarAluno(id: number) {
  const aluno = await repo.findById(id);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  return aluno;
}

// Dados enviados pelo formulário de cadastro manual (coordenador).
// `id_usuario` NÃO vem do formulário — é gerado ao criar o registro `usuario` primeiro.
export interface CreateAlunoFormData {
  nome: string;
  email: string;
  cpf: string;
  senha?: string;
  foto_url?: string;
  telefone?: string;
  data_nascimento?: string;
  cidade_nascimento?: string;
  estado_nascimento?: string;
  programa_ingresso?: string;
  data_ingresso?: string;
  escolaridade?: string;
  status_profissional?: string;
  observacoes?: string;
  estagio_jornada?: string;
  id_programa?: number;
  id_mentor_vinculado?: number | string;
}

export async function criarAluno(data: CreateAlunoFormData) {
  // Normaliza CPF: remove pontuação (ex: "123.456.789-00" → "12345678900")
  const cpfNorm = data.cpf ? data.cpf.replace(/\D/g, '') : data.cpf;

  // RN: idade mínima de 15 anos (validação no backend — não pode ser contornada pela API)
  if (data.data_nascimento) {
    const nasc = new Date(data.data_nascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    if (idade < 15) {
      throw new BadRequestError('O aluno deve ter no mínimo 15 anos de idade para ser cadastrado.');
    }
  }

  // RN: data de ingresso não pode ser futura
  if (data.data_ingresso) {
    const dIng = new Date(data.data_ingresso + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dIng > hoje) {
      throw new BadRequestError('A data de ingresso não pode ser uma data futura.');
    }
  }

  try {
    // 1. Cria o registro `usuario` e obtém o id gerado pelo banco.
    //    Senha inicial = CPF (dígitos) quando não fornecida pelo formulário.
    const usuario = await usuarioSvc.criarUsuario({
      nome: data.nome,
      email: data.email,
      cpf: cpfNorm,
      senha: data.senha ?? cpfNorm,
      foto_url: data.foto_url,
    });

    // 2. Cria o registro `aluno` vinculado ao usuario recém-criado.
    const alunoData: CreateAlunoData = {
      id_usuario: usuario.id_usuario,
      telefone: data.telefone,
      data_nascimento: data.data_nascimento,
      cidade_nascimento: data.cidade_nascimento,
      estado_nascimento: data.estado_nascimento,
      programa_ingresso: data.programa_ingresso,
      data_ingresso: data.data_ingresso,
      escolaridade: data.escolaridade,
      status_profissional: data.status_profissional,
      observacoes: data.observacoes,
      estagio_jornada: data.estagio_jornada,
    };
    const aluno = await repo.create(alunoData);

    // 3. Vincula o aluno ao programa escolhido via matrícula (Programa <-> Aluno).
    // Não bloqueia o cadastro se a matrícula falhar — o aluno já foi criado.
    if (data.id_programa) {
      try {
        await matriculaRepo.create({
          id_programa: data.id_programa,
          id_aluno: aluno.id_usuario,
          status_conclusao: 0,
          data_ingresso: data.data_ingresso || new Date().toISOString().split('T')[0],
        });
      } catch (matriculaErr) {
        console.error('Aluno criado, mas falhou ao vincular matrícula:', matriculaErr);
      }
    }

    // 4. Vincula o aluno ao mentor escolhido (programa de Mentoria) via acompanha
    // (Mentor <-> Aluno <-> Programa). Não bloqueia o cadastro se o vínculo falhar.
    if (data.id_mentor_vinculado && data.id_programa) {
      try {
        await acompanhaSvc.criarAcompanha({
          id_mentor: Number(data.id_mentor_vinculado),
          id_aluno: aluno.id_usuario,
          id_programa: data.id_programa,
        });
      } catch (acompanhaErr) {
        console.error('Aluno criado, mas falhou ao vincular mentor:', acompanhaErr);
      }
    }

    return aluno;
  } catch (err: any) {
    // Violação de unique constraint (email ou CPF duplicados)
    if (err?.code === '23505') {
      throw new ConflictError('E-mail ou CPF já cadastrado no sistema.');
    }
    throw err;
  }
}

/**
 * Garante que o aluno tenha uma matrícula no programa informado, sem duplicar
 * se já existir. Usado quando o coordenador troca o "programa atual" no perfil.
 * Nunca bloqueia a atualização do aluno se a matrícula falhar.
 */
async function vincularProgramaAoAluno(idAluno: number, idPrograma: number) {
  try {
    const existente = await matriculaRepo.findOne(idPrograma, idAluno);
    if (existente) return;
    await matriculaRepo.create({
      id_programa: idPrograma,
      id_aluno: idAluno,
      status_conclusao: 0,
      data_ingresso: new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('Aluno atualizado, mas falhou ao vincular ao novo programa:', err);
  }
}

/**
 * Atualiza dados do aluno pelo coordenador.
 * Campos `nome` e `foto_url` pertencem à tabela `usuario` e são persistidos via usuarioService;
 * `id_programa` cria/garante a matrícula no novo programa (tabela `matricula`);
 * os demais campos vão para a tabela `aluno`. Lança NotFoundError se o aluno não existir ou estiver inativo.
 */
export async function atualizarAluno(
  id: number,
  data: Parameters<typeof repo.update>[1] & { nome?: string; foto_url?: string | null; id_programa?: number },
) {
  // `nome` e `foto_url` pertencem à tabela `usuario`; `id_programa` não é coluna
  // de `aluno` (vira matrícula). Extraímos os três para evitar erro PGRST no Supabase.
  const { nome, foto_url, id_programa, ...alunoData } = data as Record<string, unknown>;

  const usuarioUpdates: Record<string, unknown> = {};
  if (nome !== undefined && nome !== '') usuarioUpdates.nome = String(nome);
  if (foto_url !== undefined) usuarioUpdates.foto_url = foto_url ?? null;

  if (Object.keys(usuarioUpdates).length > 0) {
    await usuarioSvc.atualizarDadosPessoais(id, usuarioUpdates as Parameters<typeof usuarioSvc.atualizarDadosPessoais>[1]);
  }

  const aluno = await repo.update(id, alunoData as Parameters<typeof repo.update>[1]);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id} não encontrado`);

  if (id_programa) {
    await vincularProgramaAoAluno(id, Number(id_programa));
  }

  return aluno;
}

/**
 * RN02: torna o aluno ex-aluno por inativação lógica (nunca exclui fisicamente).
 * Desfaz o vínculo do aluno com todos os programas (matricula) e mentores (acompanha),
 * já que um ex-aluno não deve permanecer associado a nenhum programa. A limpeza de
 * vínculos é non-blocking — falhas nela não impedem a transição de estado, mesmo
 * padrão usado em `vincularProgramaAoAluno`.
 * Lança NotFoundError se o aluno não existir ou já estiver inativo.
 */
export async function tornarExAluno(id: number) {
  const inativado = await repo.inactivate(id);
  if (!inativado) throw new NotFoundError(`Aluno com id ${id} não encontrado`);

  try {
    await matriculaRepo.removeByAluno(id);
    await acompanhaRepo.removeByAlunoId(id);
  } catch (err) {
    console.error(`Aluno ${id} tornou-se ex-aluno, mas falhou ao desvincular programas/mentores:`, err);
  }
}

/**
 * RN17: exclui permanentemente o perfil do aluno do banco de dados (hard delete).
 * Usado pelo coordenador para corrigir um cadastro feito por engano — diferente de
 * `tornarExAluno`, este caminho remove o registro e todos os dados vinculados de
 * forma irreversível (matricula, historico_profissional, acompanha, avaliacao etc.
 * são removidos em cascata pelo banco). Também remove o `usuario` base associado.
 * Lança NotFoundError se o aluno não existir.
 */
export async function excluirAlunoPermanentemente(id: number) {
  const excluido = await repo.hardDelete(id);
  if (!excluido) throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  await usuarioRepo.remove(id);
}

// Campos do Portal (RF005): dados do `usuario` (nome/email/senha/cpf) e dados
// do `aluno` (telefone, empresa/cargo atuais, área de interesse, disponibilidade
// para mentoria). `data_formatura` é institucional e NÃO é editável aqui (RN09).
export interface UpdatePortalData {
  nome?: string;
  email?: string;
  senha?: string;
  cpf?: string;
  foto_url?: string | null;
  telefone?: string;
  status_profissional?: string;
  empresa_atual?: string | null;
  cargo_atual?: string | null;
  area_interesse?: string | null;
  disponibilidade_mentoria?: boolean | null;
}

/**
 * RF005 / RN09: atualiza os campos editáveis pelo próprio aluno ou ex-aluno.
 * Campos aceitos: nome, email, senha, cpf (tabela usuario) + telefone, status_profissional,
 * empresa_atual, cargo_atual, area_interesse, disponibilidade_mentoria (tabela aluno).
 * `data_formatura` é institucional e nunca aceita aqui (RN09).
 * Inclui ex-alunos (ativo=false) — RF005 cobre egressos.
 * Verifica unicidade de CPF e e-mail antes de persistir (RN01).
 * Lança BadRequestError se nenhum campo enviado; ConflictError se CPF/e-mail duplicados.
 */
export async function atualizarPortalAluno(id: number, data: UpdatePortalData) {
  // TODO(auth): verificar que o solicitante é o próprio aluno antes de prosseguir

  const { nome, email, cpf, senha, foto_url } = data;
  const { telefone, status_profissional, empresa_atual, cargo_atual, area_interesse, disponibilidade_mentoria } = data;

  const algumCampoAluno =
    telefone !== undefined ||
    status_profissional !== undefined ||
    empresa_atual !== undefined ||
    cargo_atual !== undefined ||
    area_interesse !== undefined ||
    disponibilidade_mentoria !== undefined;

  // rejeita requisição sem nenhum campo antes de consultar o banco
  if (
    nome === undefined && email === undefined && cpf === undefined &&
    senha === undefined && foto_url === undefined && !algumCampoAluno
  ) {
    throw new BadRequestError('Nenhum campo para atualizar foi informado');
  }
  if (nome !== undefined && nome === '') throw new BadRequestError('Nome não pode ser vazio');
  if (email !== undefined && email === '') throw new BadRequestError('E-mail não pode ser vazio');
  if (cpf !== undefined && cpf === '') throw new BadRequestError('CPF não pode ser vazio');
  if (senha !== undefined && senha === '') throw new BadRequestError('Senha não pode ser vazia');

  // RF005 / Fluxo Principal 3: o Portal atende alunos ativos E ex-alunos
  // (ativo = false), por isso busca incluindo inativos. 404 só se não existir.
  const aluno = await repo.findByIdIncludeInactive(id);
  if (!aluno) {
    throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  }

  // RN09: verifica unicidade apenas para os campos enviados
  if (cpf !== undefined) {
    const existente = await usuarioSvc.buscarPorCpf(cpf);
    if (existente && existente.id_usuario !== id) {
      throw new ConflictError('CPF já cadastrado no sistema');
    }
  }
  if (email !== undefined) {
    const existente = await usuarioSvc.buscarPorEmail(email);
    if (existente && existente.id_usuario !== id) {
      throw new ConflictError('E-mail já cadastrado no sistema');
    }
  }

  // 1) Dados profissionais/contato (tabela `aluno`)
  if (algumCampoAluno) {
    const alunoPayload: repo.UpdateAlunoPortalData = {};
    if (telefone !== undefined) alunoPayload.telefone = telefone;
    if (status_profissional !== undefined) alunoPayload.status_profissional = status_profissional;
    if (empresa_atual !== undefined) alunoPayload.empresa_atual = empresa_atual;
    if (cargo_atual !== undefined) alunoPayload.cargo_atual = cargo_atual;
    if (area_interesse !== undefined) alunoPayload.area_interesse = area_interesse;
    if (disponibilidade_mentoria !== undefined)
      alunoPayload.disponibilidade_mentoria = disponibilidade_mentoria;
    await repo.updateDadosPortal(id, alunoPayload);
  }

  // 2) Dados pessoais (tabela `usuario`) — senha criptografada antes de persistir.
  // Retorna o `usuario` (contrato existente); o front-end recarrega o perfil
  // completo via GET após salvar, refletindo o estado real do banco.
  const usuarioPayload: { nome?: string; email?: string; cpf?: string; senha?: string; foto_url?: string | null } = {};
  if (nome !== undefined) usuarioPayload.nome = nome;
  if (email !== undefined) usuarioPayload.email = email;
  if (cpf !== undefined) usuarioPayload.cpf = cpf;
  if (senha !== undefined) usuarioPayload.senha = await bcrypt.hash(senha, 10);
  if (foto_url !== undefined) usuarioPayload.foto_url = foto_url ?? null;

  if (Object.keys(usuarioPayload).length > 0) {
    return usuarioSvc.atualizarDadosPessoais(id, usuarioPayload);
  }
  return usuarioSvc.buscarUsuario(id);
}

/** RF004 / RN05: retorna o perfil consolidado do aluno (somente-leitura). Lança NotFoundError se não encontrado ou inativo. */
export async function buscarPerfilAluno(id: number): Promise<PerfilAluno> {
  const perfil = await repo.findPerfilById(id);
  if (!perfil) throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  return perfil;
}

/** Retorna conquistas do aluno derivadas de eventos, matrículas concluídas, histórico profissional e conquistas manuais. Lança NotFoundError se o aluno não existir. */
export async function buscarConquistas(id: number): Promise<Conquista[]> {
  const conquistas = await repo.findConquistasById(id);
  if (conquistas === null) throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  return conquistas;
}

export interface CreateConquistaManualForm {
  titulo: string;
  categoria?: string;
  data: string;
  descricao?: string | null;
  arquivo_url?: string | null;
}

/**
 * Cadastra uma conquista manual (ex.: certificado com arquivo anexado) para um aluno ou ex-aluno.
 * Inclui inativos: o coordenador deve poder registrar certificados na trajetória de egressos.
 * O arquivo (PDF ou imagem em base64) é obrigatório — sem ele a conquista não tem como
 * ser distinguida de um certificado derivado automaticamente (sem arquivo real).
 * Lança BadRequestError se título, data ou arquivo não forem informados; NotFoundError se o aluno não existir.
 */
export async function criarConquistaManual(id: number, data: CreateConquistaManualForm) {
  if (!data.titulo) throw new BadRequestError('Título é obrigatório');
  if (!data.data) throw new BadRequestError('Data é obrigatória');
  if (!data.arquivo_url) throw new BadRequestError('Arquivo do certificado (PDF ou imagem) é obrigatório');

  const aluno = await repo.findByIdIncludeInactive(id);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id} não encontrado`);

  return conquistaManualRepo.create({
    id_aluno: id,
    titulo: data.titulo,
    categoria: data.categoria || 'Certificado',
    data: data.data,
    descricao: data.descricao ?? null,
    arquivo_url: data.arquivo_url ?? null,
  });
}

/**
 * Remove uma conquista cadastrada manualmente (ex.: certificado anexado pelo coordenador).
 * Inclui inativos: o coordenador também gerencia conquistas de ex-alunos.
 * @throws {NotFoundError} se o aluno ou a conquista não forem encontrados
 */
export async function deletarConquistaManual(id: number, idConquista: number) {
  const aluno = await repo.findByIdIncludeInactive(id);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id} não encontrado`);

  const removida = await conquistaManualRepo.remove(idConquista, id);
  if (!removida) throw new NotFoundError(`Conquista com id ${idConquista} não encontrada para este aluno`);
}

/** Autentica aluno ou ex-aluno pelo e-mail. Retorna id, ativo, nome e e-mail; null se não encontrado. */
export async function loginAluno(email: string): Promise<{ id_usuario: number; ativo: boolean; nome: string; email: string } | null> {
  const usuario = await usuarioSvc.buscarPorEmail(email.toLowerCase().trim());
  if (!usuario) return null;
  const aluno = await repo.findByIdIncludeInactive(usuario.id_usuario);
  if (!aluno) return null;
  return { id_usuario: usuario.id_usuario, ativo: aluno.ativo, nome: usuario.nome, email: usuario.email };
}

/**
 * RF005 / RN07 / RN09: retorna os dados do Portal do Aluno (sem senha, sem histórico institucional).
 * Inclui ex-alunos (ativo=false). Lança NotFoundError se o aluno não existir.
 */
export async function buscarDadosPortal(id: number) {
  // RF005 / Fluxo Principal 3: inclui inativos para atender também o ex-aluno.
  const aluno = await repo.findByIdIncludeInactive(id);
  if (!aluno) {
    throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  }
  // RN09: expõe apenas os dados do próprio aluno — sem senha
  const usuario = await usuarioSvc.buscarUsuario(id);
  if (!usuario) throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  const { senha: _omit, ...dadosPublicos } = usuario as any;
  return { ...aluno, usuario: dadosPublicos };
}
