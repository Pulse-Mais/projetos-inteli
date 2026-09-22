import { Router } from 'express';
import multer from 'multer';
import { importarAlunos } from '../controllers/importacaoController';

const upload = multer({ storage: multer.memoryStorage() });

export const importacaoRoutes = Router();

importacaoRoutes.post('/alunos', upload.single('arquivo'), importarAlunos);