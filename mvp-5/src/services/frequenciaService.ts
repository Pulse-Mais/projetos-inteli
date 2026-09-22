import * as frequenciaAulaRepo from '../repositories/frequenciaAulaRepository';
import * as participacaoEventoRepo from '../repositories/participacaoEventoRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';
import type { FrequenciaAula } from '../models/frequenciaAula';
import type { ParticipacaoEvento } from '../models/participacaoEvento';

interface RegistrarFrequenciaInput {
  tipo: 'aula' | 'evento';
  id_jovem: number;
  id_aula?: number;
  aula?: string;
  data?: Date;
  id_evento?: number;
  evento?: string;
  presente: boolean;
}

export async function registrar(
  dados: RegistrarFrequenciaInput
): Promise<FrequenciaAula | ParticipacaoEvento> {
  if (!dados.id_jovem) {
    throw new ValidationError('id_jovem é obrigatório');
  }

  if (typeof dados.presente !== 'boolean') {
    throw new ValidationError('presente deve ser booleano');
  }

  if (dados.tipo === 'aula') {
    if (!dados.id_aula) {
      throw new ValidationError('id_aula é obrigatório para tipo aula');
    }

    if (!dados.aula) {
      throw new ValidationError('aula é obrigatória para tipo aula');
    }

    if (!dados.data) {
      throw new ValidationError('data é obrigatória para tipo aula');
    }

    return frequenciaAulaRepo.inserir({
      id_jovem: dados.id_jovem,
      id_aula: dados.id_aula,
      aula: dados.aula,
      data: dados.data,
      presente: dados.presente,
    });
  }

  if (dados.tipo === 'evento') {
    if (!dados.id_evento) {
      throw new ValidationError('id_evento é obrigatório para tipo evento');
    }

    if (!dados.evento) {
      throw new ValidationError('evento é obrigatório para tipo evento');
    }

    if (!dados.data) {
      throw new ValidationError('data é obrigatória para tipo evento');
    }

    return participacaoEventoRepo.inserir({
      id_jovem: dados.id_jovem,
      id_evento: dados.id_evento,
      evento: dados.evento,
      data: dados.data,
      presente: dados.presente,
    });
  }

  throw new ValidationError("tipo deve ser 'aula' ou 'evento'");
}

export async function buscarFrequenciasAulaPorJovem(
  idJovem: number
): Promise<FrequenciaAula[]> {
  return frequenciaAulaRepo.buscarPorJovem(idJovem);
}

export async function buscarParticipacaoEventosPorJovem(
  idJovem: number
): Promise<ParticipacaoEvento[]> {
  return participacaoEventoRepo.buscarPorJovem(idJovem);
}

export async function calcularTaxaPresencaAula(idJovem: number): Promise<number> {
  return frequenciaAulaRepo.calcularTaxaPresenca(idJovem);
}

export async function calcularTaxaParticipacaoEvento(idJovem: number): Promise<number> {
  return participacaoEventoRepo.calcularTaxaParticipacao(idJovem);
}

export async function removerFrequenciaAula(id: number): Promise<void> {
  const removido = await frequenciaAulaRepo.remover(id);
  if (!removido) throw new NotFoundError('frequência de aula');
}

export async function removerParticipacaoEvento(id: number): Promise<void> {
  const removido = await participacaoEventoRepo.remover(id);
  if (!removido) throw new NotFoundError('participação em evento');
}