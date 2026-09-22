import { Router } from 'express';
import { listar, buscar, criar, atualizar, deletar } from '../controllers/mentoriaController';

const mentoriaRoutes = Router();

mentoriaRoutes.get('/', listar);
mentoriaRoutes.get('/:id', buscar);
mentoriaRoutes.post('/', criar);    // exige mentor ativo e aluno ativo (RN11)
mentoriaRoutes.put('/:id', atualizar);
mentoriaRoutes.delete('/:id', deletar); // exclusão física (sem soft-delete)

export { mentoriaRoutes };
