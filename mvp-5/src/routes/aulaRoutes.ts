import { Router } from 'express';
import * as aulaController from '../controllers/aulaController';
import { asyncHandler } from '../helpers/asyncHandler';

const router = Router();

router.get('/', asyncHandler(aulaController.listar));
router.get('/:id', asyncHandler(aulaController.buscar));
router.post('/', asyncHandler(aulaController.criar));
router.put('/:id', asyncHandler(aulaController.atualizar));
router.delete('/:id', asyncHandler(aulaController.remover));

export default router;
