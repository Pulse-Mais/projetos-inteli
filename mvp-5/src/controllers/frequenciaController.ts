import type { Request, Response } from 'express';
import * as frequenciaService from '../services/frequenciaService';
import { parseId } from '../helpers/parseId';

export async function registrar(req: Request, res: Response): Promise<void> {
  const resultado = await frequenciaService.registrar(req.body);
  res.status(201).json(resultado);
}

export async function buscarFrequenciasAulaPorJovem(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const frequencias = await frequenciaService.buscarFrequenciasAulaPorJovem(idJovem);
  res.status(200).json(frequencias);
}

export async function buscarParticipacaoEventosPorJovem(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const participacoes = await frequenciaService.buscarParticipacaoEventosPorJovem(idJovem);
  res.status(200).json(participacoes);
}

export async function calcularTaxaPresencaAula(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const taxa = await frequenciaService.calcularTaxaPresencaAula(idJovem);
  res.status(200).json({ taxa });
}

export async function calcularTaxaParticipacaoEvento(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const taxa = await frequenciaService.calcularTaxaParticipacaoEvento(idJovem);
  res.status(200).json({ taxa });
}

export async function removerFrequenciaAula(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await frequenciaService.removerFrequenciaAula(id);
  res.status(204).send();
}

export async function removerParticipacaoEvento(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await frequenciaService.removerParticipacaoEvento(id);
  res.status(204).send();
}