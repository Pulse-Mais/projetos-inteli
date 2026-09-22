import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as exportController from '../controllers/exportController';

const router = Router();

router.get('/template', exportController.exportarTemplate);
router.get('/',         asyncHandler(exportController.exportarJovens));

export default router;
