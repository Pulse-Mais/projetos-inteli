import type { Request, Response } from 'express';
import * as programaService from '../services/programaService';
import { parseId } from '../helpers/parseId';

export async function listar(req: Request, res: Response): Promise<void> {
  const programas = await programaService.listar();
  res.status(200).json(programas);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const programa = await programaService.buscarPorId(id);
  res.status(200).json(programa);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const programa = await programaService.criar(req.body);
  res.status(201).location(`/api/programas/${programa.id}`).json(programa);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const programa = await programaService.atualizar(id, req.body);
  res.status(200).json(programa);
}

export async function listarAlunos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const alunos = await programaService.listStudents(id);
  res.status(200).json(alunos);
}

export async function listarEventos(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const eventos = await programaService.listEvents(id);
  res.status(200).json(eventos);
}

export async function criarInscricao(req: Request, res: Response): Promise<void> {
  const id_jovem = parseId(req.params.id, 'id_jovem');
  const inscricao = await programaService.inserirInscricao(id_jovem, req.body);
  res.status(201).location(`/api/jovens/${id_jovem}/inscricao/${inscricao.id}`).json(inscricao);
}

export async function listarInscricoes(req: Request, res: Response): Promise<void> {
  const id_jovem = parseId(req.params.id, 'id_jovem');
  const inscricoes = await programaService.listarInscricoes(id_jovem);
  res.status(200).json(inscricoes);
}
