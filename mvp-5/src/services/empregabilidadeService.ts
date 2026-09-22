import { pool } from '../db/pool';
import * as repo from '../repositories/empregabilidadeRepository';
import { Empregabilidade } from '../models/empregabilidade';
import { SituacaoEmpregabilidade, TipoContrato } from '../models/enums';
import { ValidationError } from '../errors/AppError';

const SITUACOES: SituacaoEmpregabilidade[] = ['Empregado', 'Procurando'];

export async function obterHistorico(id_jovem: number): Promise<Empregabilidade[]> {
  return repo.buscarPorJovem(id_jovem);
}

export async function criarRegistro(
  id_jovem: number,
  dados: {
    situacao: SituacaoEmpregabilidade;
    vinculo?: TipoContrato;
    empresa?: string;
    area_atuacao?: string;
    renda_atual?: number;
  }
): Promise<Empregabilidade> {
  // RN12 — status profissional deve ser um dos valores válidos.
  if (!dados.situacao || !SITUACOES.includes(dados.situacao)) {
    throw new ValidationError(
      `situacao inválida: use ${SITUACOES.join(', ')}`
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await repo.encerrarAtivos(client, id_jovem);
    const novo = await repo.inserir(client, {
      id_jovem,
      situacao: dados.situacao,
      vinculo: dados.vinculo ?? null,
      empresa: dados.empresa ?? null,
      area_atuacao: dados.area_atuacao ?? null,
      renda_atual: dados.renda_atual ?? null,
    });
    await client.query('COMMIT');
    return novo;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function estaAtivo(registro: Empregabilidade): boolean {
  return !registro.encerrado;
}

export function obterDuracao(registro: Empregabilidade): number {
  const inicio = new Date(registro.data_registro);
  const fim = new Date();
  return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
}
