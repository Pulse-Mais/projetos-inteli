import { Router } from 'express';
import * as ctrl from '../controllers/indicadorController';

export const indicadorRoutes = Router();

indicadorRoutes.get('/', ctrl.listar);
indicadorRoutes.get('/:id', ctrl.buscar);
indicadorRoutes.post('/', ctrl.criar);
indicadorRoutes.put('/:id', ctrl.atualizar);
indicadorRoutes.delete('/:id', ctrl.deletar);