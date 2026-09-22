import { Router } from 'express';
import * as ctrl from '../controllers/avaliacaoController';

export const avaliacaoRoutes = Router();

avaliacaoRoutes.get('/', ctrl.listar);
avaliacaoRoutes.get('/:id', ctrl.buscar);
avaliacaoRoutes.post('/', ctrl.criar);
avaliacaoRoutes.put('/:id', ctrl.atualizar);
avaliacaoRoutes.delete('/:id', ctrl.deletar);