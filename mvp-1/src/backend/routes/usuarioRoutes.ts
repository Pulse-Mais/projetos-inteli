import { Router } from 'express';
import * as ctrl from '../controllers/usuarioController';

export const usuarioRoutes = Router();

usuarioRoutes.get('/login', ctrl.loginPorEmail);
usuarioRoutes.get('/', ctrl.listar);
usuarioRoutes.get('/:id', ctrl.buscar);
usuarioRoutes.post('/', ctrl.criar);
usuarioRoutes.put('/:id', ctrl.atualizar);
usuarioRoutes.delete('/:id', ctrl.deletar);
