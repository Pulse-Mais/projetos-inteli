import type { Request, Response } from 'express';
import * as jovemService from '../services/jovemService';
import type { JovemCriacao, JovemAtualizacao, JovemFiltros } from '../models/jovem';
import type { ClassificacaoPulse, StatusGlobal } from '../models/enums';
import { ValidationError } from '../errors/AppError';
import { parseId } from '../helpers/parseId';

export async function listar(req: Request, res: Response): Promise<void> {
  const filtros: JovemFiltros = {};

  if (req.query.categoria !== undefined) {
    const valor = String(req.query.categoria);
    if (!ehClassificacaoPulse(valor)) {
      throw new ValidationError('categoria inválida: use Conectado, Capacitado ou Transformado');
    }
    filtros.categoria = valor;
  }

  if (req.query.status_global !== undefined) {
    const valor = String(req.query.status_global);
    if (!ehStatusGlobal(valor)) {
      throw new ValidationError('status_global inválido: use Ativo, Formado, Evadido ou Inativo');
    }
    filtros.status_global = valor;
  }

  if (req.query.programa !== undefined) {
    const valor = Number(req.query.programa);
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new ValidationError('programa deve ser um id numérico positivo');
    }
    filtros.programa = valor;
  }

  const jovens = await jovemService.listar(filtros);
  res.status(200).json(jovens);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const jovem = await jovemService.buscarPorId(id);
  res.status(200).json(jovem);
}

export async function buscarPerfilCompleto(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req.params.id);

  const perfil = await jovemService.obterPerfilCompleto(id);
  res.status(200).json(perfil);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const idUsuario = Number((req.body as { id_usuario?: number }).id_usuario ?? req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório (body ou query param)');
  }

  const dados = req.body as JovemCriacao;
  const jovemCriado = await jovemService.criar(dados, idUsuario);

  res
    .status(201)
    .location(`/api/jovens/${jovemCriado.id}`)
    .json(jovemCriado);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const idUsuario = Number((req.body as { id_usuario?: number }).id_usuario ?? req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório (body ou query param)');
  }

  const dados = req.body as JovemAtualizacao;
  const atualizado = await jovemService.atualizar(id, dados, idUsuario);
  res.status(200).json(atualizado);
}

export async function remover(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const idUsuario = Number(req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório como query param');
  }

  await jovemService.remover(id, idUsuario);
  res.status(204).send();
}

export async function listarCategorias(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const categorias = await jovemService.listarCategorias(id);
  res.status(200).json(categorias);
}

export async function criarCategoria(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const { categoria_adquirida, id_usuario } = req.body as { categoria_adquirida: string; id_usuario?: number };
  if (!categoria_adquirida || !ehClassificacaoPulse(categoria_adquirida)) {
    throw new ValidationError('categoria_adquirida deve ser Conectado, Capacitado ou Transformado');
  }

  const idUsuario = Number(id_usuario ?? req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório (body ou query param)');
  }

  const categoria = await jovemService.mudarCategoria(id, categoria_adquirida, idUsuario);
  res.status(201).json(categoria);
}

function ehClassificacaoPulse(valor: string): valor is ClassificacaoPulse {
  return valor === 'Conectado' || valor === 'Capacitado' || valor === 'Transformado';
}

function ehStatusGlobal(valor: string): valor is StatusGlobal {
  return valor === 'Ativo' || valor === 'Formado' || valor === 'Evadido' || valor === 'Inativo';
}
