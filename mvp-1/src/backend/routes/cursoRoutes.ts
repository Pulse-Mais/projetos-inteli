import { Router } from 'express';
import * as ctrl from '../controllers/cursoController';
import * as aulaCtrl from '../controllers/aulaController';

export const cursoRoutes = Router();

cursoRoutes.get('/:id', ctrl.buscar);
cursoRoutes.get('/:id/aulas', aulaCtrl.listarPorCurso);
cursoRoutes.post('/:id/aulas', aulaCtrl.criar);
cursoRoutes.put('/:id', ctrl.atualizar);
cursoRoutes.delete('/:id', ctrl.deletar);
