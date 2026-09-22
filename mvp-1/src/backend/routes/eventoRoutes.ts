import { Router } from 'express';
import { listar, buscar, criar, atualizar, deletar } from '../controllers/eventoController';

const eventoRoutes = Router();

eventoRoutes.get('/', listar);
eventoRoutes.get('/:id', buscar);
eventoRoutes.post('/', criar);
eventoRoutes.put('/:id', atualizar);
eventoRoutes.delete('/:id', deletar);

export { eventoRoutes };
