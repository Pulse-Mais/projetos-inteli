import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import * as svc from '../services/alunoService';
import { AlunoFiltros } from '../repositories/alunoRepository';

/**
 * GET /alunos/login?email=<e-mail> — autentica aluno ou ex-aluno por e-mail.
 * Validação: e-mail obrigatório na query string.
 * Retorna 200 com { id_usuario, ativo, nome, email }; 400 se e-mail ausente; 404 se não encontrado.
 */
export const loginPorEmail = asyncHandler(async (req: Request, res: Response) => {
  const email = (req.query.email as string || '').trim();
  if (!email) throw new BadRequestError('E-mail é obrigatório');
  const aluno = await svc.loginAluno(email);
  if (!aluno) throw new NotFoundError('E-mail não encontrado ou sem acesso de aluno');
  res.json(aluno);
});

/**
 * GET /alunos — lista alunos com filtros opcionais (nome, cpf, email, ativo).
 * RF009: sem `ativo` explícito retorna apenas alunos ativos.
 * Retorna 200 com array de AlunoComUsuario.
 */
export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { nome, cpf, email, ativo } = req.query;

  // Query string sempre chega como string (ou undefined). Montamos o objeto
  // de filtros incluindo apenas o que foi efetivamente passado, para que o
  // service consiga aplicar o default de `ativo` corretamente.
  const filtros: AlunoFiltros = {};
  if (typeof nome === 'string' && nome.length > 0) filtros.nome = nome;
  if (typeof cpf === 'string' && cpf.length > 0) filtros.cpf = cpf;
  if (typeof email === 'string' && email.length > 0) filtros.email = email;
  if (ativo === 'true') filtros.ativo = true;
  else if (ativo === 'false') filtros.ativo = false;
  // Qualquer outro valor de `ativo` (inclusive omissão) deixa o campo
  // indefinido, e o service aplica o default = true.

  const alunos = await svc.listarAlunos(filtros);
  console.log(`[API] Listando ${alunos.length} alunos (Filtros: ${JSON.stringify(filtros)})`);
  res.json(alunos);
});

/**
 * GET /alunos/:id — retorna um aluno ativo pelo ID.
 * Retorna 200 com Aluno; 404 se não encontrado ou inativo.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await svc.buscarAluno(Number(req.params.id));
  res.json(aluno);
});

/**
 * POST /alunos — cria um novo aluno.
 * Validação: idade mínima de 15 anos, data de ingresso não futura, CPF/e-mail únicos.
 * Retorna 201 com Aluno criado; 400 em falhas de validação; 409 se CPF ou e-mail duplicados.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await svc.criarAluno(req.body);
  res.status(201).json(aluno);
});

/**
 * PUT /alunos/:id — atualiza dados de um aluno ativo.
 * `nome` e `foto_url` são gravados na tabela `usuario`; demais campos em `aluno`.
 * Retorna 200 com Aluno atualizado; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await svc.atualizarAluno(Number(req.params.id), req.body);
  res.json(aluno);
});

/**
 * PATCH /alunos/:id/tornar-ex-aluno — torna o aluno ex-aluno (inativação lógica, RN02).
 * Desvincula o aluno de todos os programas e mentores.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const tornarExAluno = asyncHandler(async (req: Request, res: Response) => {
  await svc.tornarExAluno(Number(req.params.id));
  res.status(204).send();
});

/**
 * DELETE /alunos/:id — exclui permanentemente o perfil do aluno do banco (RN17).
 * Usado para corrigir cadastros feitos por engano; remove o registro e todos os
 * dados vinculados de forma irreversível.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const excluirPermanente = asyncHandler(async (req: Request, res: Response) => {
  await svc.excluirAlunoPermanentemente(Number(req.params.id));
  res.status(204).send();
});

/**
 * GET /alunos/:id/perfil — retorna o perfil consolidado do aluno (RF004, RN05).
 * Agrega programas, eventos, avaliações, mentorias e histórico profissional.
 * Retorna 200 com PerfilAluno; 404 se não encontrado.
 */
export const buscarPerfil = asyncHandler(async (req: Request, res: Response) => {
  const perfil = await svc.buscarPerfilAluno(Number(req.params.id));
  res.json(perfil);
});

/**
 * GET /alunos/:id/conquistas — retorna conquistas derivadas de eventos, certificados e histórico.
 * Retorna 200 com array de Conquista; 404 se não encontrado.
 */
export const buscarConquistas = asyncHandler(async (req: Request, res: Response) => {
  const conquistas = await svc.buscarConquistas(Number(req.params.id));
  res.json(conquistas);
});

/**
 * POST /alunos/:id/conquistas-manuais — coordenador cadastra uma conquista manual
 * (ex.: certificado com PDF/imagem anexado em base64). Inclui ex-alunos.
 * Retorna 201 com a conquista criada; 400 se título/data ausentes; 404 se aluno não encontrado.
 */
export const criarConquistaManual = asyncHandler(async (req: Request, res: Response) => {
  const conquista = await svc.criarConquistaManual(Number(req.params.id), req.body);
  res.status(201).json(conquista);
});

/**
 * DELETE /alunos/:id/conquistas-manuais/:id_conquista — remove uma conquista manual
 * (ex.: certificado anexado pelo coordenador). Inclui ex-alunos.
 * Retorna 204 sem corpo; 404 se aluno ou conquista não encontrados.
 */
export const deletarConquistaManual = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarConquistaManual(Number(req.params.id), Number(req.params.id_conquista));
  res.status(204).send();
});

/**
 * GET /alunos/:id/portal — retorna dados do Portal do Aluno/Ex-Aluno (RF005, RN07).
 * Inclui inativos para atender ex-alunos (Fluxo Principal 3).
 * Retorna 200; 404 se ID inexistente.
 */
export const buscarPortal = asyncHandler(async (req: Request, res: Response) => {
  const dados = await svc.buscarDadosPortal(Number(req.params.id));
  res.json(dados);
});

/**
 * PUT /alunos/:id/portal — atualiza os campos editáveis pelo próprio aluno/ex-aluno (RF005, RN09).
 * Campos aceitos: nome, email, senha, cpf, telefone, status_profissional,
 * empresa_atual, cargo_atual, area_interesse, disponibilidade_mentoria.
 * `data_formatura` é institucional e nunca aceita aqui.
 * Retorna 200 com dados públicos (sem senha); 400 se ID inválido ou campos vazios;
 * 404 se não encontrado; 409 se CPF ou e-mail já pertencem a outro cadastro.
 */
export const atualizarPortal = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) throw new BadRequestError('ID inválido');

  // extrai apenas os campos permitidos para evitar sobrescrita de campos não autorizados
  const {
    nome, email, senha, cpf, foto_url,
    telefone, status_profissional,
    empresa_atual, cargo_atual, area_interesse, disponibilidade_mentoria,
  } = req.body as svc.UpdatePortalData;

  const resultado = await svc.atualizarPortalAluno(id, {
    nome, email, senha, cpf, foto_url,
    telefone, status_profissional,
    empresa_atual, cargo_atual, area_interesse, disponibilidade_mentoria,
  });

  // remove a senha do retorno — campo sensível nunca é exposto na resposta
  const { senha: _omit, ...dadosPublicos } = resultado as any;
  res.json(dadosPublicos);
});
