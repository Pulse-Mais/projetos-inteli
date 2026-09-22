import { Router } from 'express';
import * as ctrl from '../controllers/aulaController';

export const aulaRoutes = Router();

aulaRoutes.get('/:id', ctrl.buscar);
aulaRoutes.put('/:id', ctrl.atualizar);
aulaRoutes.delete('/:id', ctrl.deletar);
