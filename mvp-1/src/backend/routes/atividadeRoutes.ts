import { Router } from 'express';
import { listar, buscar, criar, atualizar, deletar } from '../controllers/atividadeController';

const atividadeRoutes = Router();

atividadeRoutes.get('/', listar);
atividadeRoutes.get('/:id', buscar);
atividadeRoutes.post('/', criar);
atividadeRoutes.put('/:id', atualizar);
atividadeRoutes.delete('/:id', deletar);

export { atividadeRoutes };
