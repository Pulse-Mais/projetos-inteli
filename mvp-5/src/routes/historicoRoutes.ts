import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as historicoController from '../controllers/historicoController';

const router = Router();

router.get('/', asyncHandler(historicoController.listar));

export default router;
