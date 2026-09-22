import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../helpers/asyncHandler';
import * as importController from '../controllers/importController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('arquivo'), asyncHandler(importController.importarJovens));

export default router;