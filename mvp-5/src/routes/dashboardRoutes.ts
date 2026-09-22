import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as dashboardController from '../controllers/dashboardController';

/**
 * Montado em /api/dashboard.
 * GET /api/dashboard?id_usuario=<id>
 * Acesso restrito ao perfil Gestao — validação dentro do service.
 */
const router = Router();

router.get('/', asyncHandler(dashboardController.obterIndicadores));
router.get('/empregabilidade', asyncHandler(dashboardController.obterEmpregabilidade));
router.get('/engajamento', asyncHandler(dashboardController.obterEngajamento));
router.get('/ensino-superior', asyncHandler(dashboardController.obterEnsinoSuperior));

export default router;
