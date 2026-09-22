import { Router } from 'express';
import * as ctrl from '../controllers/programaController';
import * as cursoCtrl from '../controllers/cursoController';

export const programaRoutes = Router();

programaRoutes.get('/', ctrl.listar);
programaRoutes.get('/:id', ctrl.buscar);
programaRoutes.get('/:id/cursos', cursoCtrl.listarPorPrograma);
programaRoutes.post('/:id/cursos', cursoCtrl.criar);
programaRoutes.post('/', ctrl.criar);
programaRoutes.put('/:id', ctrl.atualizar);
programaRoutes.delete('/:id', ctrl.deletar);
