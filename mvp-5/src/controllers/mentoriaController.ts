import type { Request, Response } from 'express';
import * as mentoriaService from '../services/mentoriaService';
import { parseId } from '../helpers/parseId';
import { ValidationError } from '../errors/AppError';

export async function listarPorMentor(req: Request, res: Response): Promise<void> {
  const id_mentor = parseId(req.params.id, 'id_mentor');
  const sessoes = await mentoriaService.listarPorMentor(id_mentor);
  res.status(200).json(sessoes);
}

export async function criarSessao(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    id_jovem?: unknown;
    id_mentor?: unknown;
    data?: string;
    presente?: unknown;
    avaliacao?: number | null;
    duracao_minutos?: number | null;
    id_usuario?: number;
  };

  const id_jovem  = parseId(body.id_jovem, 'id_jovem');
  const id_mentor = parseId(body.id_mentor, 'id_mentor');
  if (!body.data) throw new ValidationError('data é obrigatória');

  // Sem middleware de auth (fora de escopo do MVP), id_usuario vem do body/query.
  // A autorização efetiva por perfil é feita no service (validarPerfil).
  const idUsuario = Number(body.id_usuario ?? req.query.id_usuario);

  const sessao = await mentoriaService.criarSessao(
    {
      id_jovem,
      id_mentor,
      data: new Date(body.data),
      presente: Boolean(body.presente),
      avaliacao: body.avaliacao ?? null,
      duracao_minutos: body.duracao_minutos ?? null,
    },
    idUsuario
  );
  res.status(201).json(sessao);
}

export async function atualizarSessao(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  // Sem middleware de auth (fora de escopo do MVP), id_usuario vem do body/query.
  // A autorização efetiva por perfil é feita no service (ForbiddenError).
  const idUsuario = Number(
    (req.body as { id_usuario?: number })?.id_usuario ?? req.query.id_usuario
  );
  const sessao = await mentoriaService.atualizarSessao(id, req.body, idUsuario);
  res.status(200).json(sessao);
}
