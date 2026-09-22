import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as jovemController from '../controllers/jovemController';

const router = Router();

router.get('/', asyncHandler(jovemController.listar));
router.get('/:id/perfil-completo', asyncHandler(jovemController.buscarPerfilCompleto));
router.get('/:id/categoria', asyncHandler(jovemController.listarCategorias));
router.get('/:id', asyncHandler(jovemController.buscar));
router.post('/', asyncHandler(jovemController.criar));
router.post('/:id/categoria', asyncHandler(jovemController.criarCategoria));
router.patch('/:id', asyncHandler(jovemController.atualizar));
router.delete('/:id', asyncHandler(jovemController.remover));

export default router;
