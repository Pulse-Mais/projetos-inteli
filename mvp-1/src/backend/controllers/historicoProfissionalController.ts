import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import { NotFoundError } from '../errors/AppError';
import * as alunoRepo from '../repositories/alunoRepository';
import * as repo from '../repositories/historicoProfissionalRepository';

/**
 * Valida que o aluno existe antes de qualquer operação de histórico.
 * Inclui ex-alunos (ativo = false): o histórico profissional é uma das fontes de
 * conquistas (ver findConquistasById) e o coordenador precisa registrar marcos
 * profissionais também após a formatura. Lança 404 se o aluno não existir.
 */
async function resolveAluno(id: number) {
  const aluno = await alunoRepo.findByIdIncludeInactive(id);
  if (!aluno) {
    throw new NotFoundError(`Aluno com id ${id} não encontrado`);
  }
  return aluno;
}

/**
 * GET /alunos/:id/historico — lista o histórico profissional de um aluno, ordenado por data_inicio desc.
 * Retorna 200 com array de HistoricoProfissional; 404 se aluno não encontrado.
 */
export const listar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await resolveAluno(Number(req.params.id));
  const historico = await repo.findAllByAluno(aluno.id_usuario);
  res.json(historico);
});

/**
 * POST /alunos/:id/historico — adiciona um registro profissional ao histórico do aluno
 * (inclui ex-alunos, já que isso alimenta a categoria "Conquista Profissional" das conquistas).
 * Campos aceitos: cargo, empresa, data_inicio, data_fim (opcional).
 * Retorna 201 com HistoricoProfissional; 404 se aluno não encontrado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await resolveAluno(Number(req.params.id));
  const { cargo, empresa, data_inicio, data_fim } = req.body;
  const registro = await repo.create({
    cargo,
    empresa,
    data_inicio,
    data_fim: data_fim ?? null,
    id_aluno: aluno.id_usuario,
  });
  res.status(201).json(registro);
});

/**
 * PUT /alunos/:id/historico/:id_hist — atualiza um registro do histórico profissional.
 * Aceita atualização parcial: apenas os campos presentes no body são modificados.
 * Retorna 200 com HistoricoProfissional; 404 se aluno ou registro não encontrados.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await resolveAluno(Number(req.params.id));
  const idHist = Number(req.params.id_hist);
  const { cargo, empresa, data_inicio, data_fim } = req.body;
  const payload: repo.UpdateHistoricoData = {};
  if (cargo !== undefined) payload.cargo = cargo;
  if (empresa !== undefined) payload.empresa = empresa;
  if (data_inicio !== undefined) payload.data_inicio = data_inicio;
  if (data_fim !== undefined) payload.data_fim = data_fim;
  const atualizado = await repo.update(idHist, aluno.id_usuario, payload); // id_usuario = id_aluno (PK compartilhada)
  if (!atualizado) throw new NotFoundError(`Histórico com id ${idHist} não encontrado`);
  res.json(atualizado);
});

/**
 * DELETE /alunos/:id/historico/:id_hist — remove um registro do histórico profissional.
 * Retorna 204 sem corpo; 404 se aluno ou registro não encontrados.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  const aluno = await resolveAluno(Number(req.params.id));
  const idHist = Number(req.params.id_hist);
  const removido = await repo.remove(idHist, aluno.id_usuario);
  if (!removido) throw new NotFoundError(`Histórico com id ${idHist} não encontrado`);
  res.status(204).send();
});
