import { Router } from 'express';
import * as controller from '../controllers/usuarioController';
import { asyncHandler } from '../helpers/asyncHandler';

const router = Router();

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscar));
router.post('/', asyncHandler(controller.criar));
router.put('/:id', asyncHandler(controller.atualizar));
router.delete('/:id', asyncHandler(controller.remover));

export default router;