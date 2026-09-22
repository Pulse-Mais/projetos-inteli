import { Router } from 'express';
import { listarEstados, listarCidades, listarEslagios } from '../controllers/localidadeController';

const localidadeRoutes = Router();

localidadeRoutes.get('/estados',        listarEstados);
localidadeRoutes.get('/estagios',       listarEslagios);
localidadeRoutes.get('/cidades/:uf',    listarCidades);

export { localidadeRoutes };
