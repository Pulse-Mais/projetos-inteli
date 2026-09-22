import { Router } from 'express';
import { listar, criar, atualizar, remover } from '../controllers/oportunidadeController';

const oportunidadeRoutes = Router();
oportunidadeRoutes.get('/',       listar);
oportunidadeRoutes.post('/',      criar);
oportunidadeRoutes.put('/:id',    atualizar);
oportunidadeRoutes.delete('/:id', remover);

export { oportunidadeRoutes };