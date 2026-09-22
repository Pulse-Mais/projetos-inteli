import { Router } from 'express';
import { buscar, salvar } from '../controllers/frequenciaController';

const frequenciaRoutes = Router();

frequenciaRoutes.get('/', buscar);
frequenciaRoutes.post('/', salvar);

export { frequenciaRoutes };
