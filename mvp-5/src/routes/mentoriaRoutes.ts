import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as controller from '../controllers/mentoriaController';

// GET /mentor/:id/mentorias — diagrama F1 do Mentor
export const mentorRouter = Router();
mentorRouter.get('/:id/mentorias', asyncHandler(controller.listarPorMentor));

// POST /mentorias — cria sessão; PUT /mentorias/:id/info — diagrama F2 do Mentor
export const sessaoRouter = Router();
sessaoRouter.post('/', asyncHandler(controller.criarSessao));
sessaoRouter.put('/:id/info', asyncHandler(controller.atualizarSessao));
