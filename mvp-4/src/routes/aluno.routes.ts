import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller';
import { AlunoService } from '../services/aluno.service';
import { AlunoRepository } from '../repositories/aluno.repository';
import { validarParamNumerico, exigirBody } from '../middlewares/validacao';

const repositories = new AlunoRepository();
const service = new AlunoService(repositories);
const controller = new AlunoController(service);

const router = Router();

router.get(
  '/alunos/:ra',
  validarParamNumerico('ra', 'RA'),
  (req, res, next) => {
    controller.buscarPorRa(req, res).catch(next);
  },
);

router.patch(
  '/alunos/:ra',
  validarParamNumerico('ra', 'RA'),
  exigirBody,
  (req, res, next) => {
    controller.atualizar(req, res).catch(next);
  },
);

export default router;
