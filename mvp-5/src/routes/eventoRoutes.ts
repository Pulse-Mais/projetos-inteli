import { Router } from 'express';
import * as eventoController from '../controllers/eventoController';
import { asyncHandler } from '../helpers/asyncHandler';

const router = Router();

router.get('/', asyncHandler(eventoController.listar));
router.get('/:id', asyncHandler(eventoController.buscar));
router.post('/', asyncHandler(eventoController.criar));
router.put('/:id', asyncHandler(eventoController.atualizar));
router.delete('/:id', asyncHandler(eventoController.remover));

export default router;
