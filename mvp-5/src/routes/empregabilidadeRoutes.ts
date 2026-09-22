import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as controller from '../controllers/empregabilidadeController';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(controller.listar));
router.post('/', asyncHandler(controller.criar));

export default router;
