import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as controller from '../controllers/programaController';

export const programaRouter = Router();

programaRouter.get('/', asyncHandler(controller.listar));
programaRouter.get('/:id', asyncHandler(controller.buscar));
programaRouter.post('/', asyncHandler(controller.criar));
programaRouter.put('/:id', asyncHandler(controller.atualizar));
programaRouter.get('/:id/alunos', asyncHandler(controller.listarAlunos));
programaRouter.get('/:id/eventos', asyncHandler(controller.listarEventos));

// Roteador separado montado em /jovens no index.ts
export const inscricaoRouter = Router();

inscricaoRouter.get('/:id/inscricao', asyncHandler(controller.listarInscricoes));
inscricaoRouter.post('/:id/inscricao', asyncHandler(controller.criarInscricao));
