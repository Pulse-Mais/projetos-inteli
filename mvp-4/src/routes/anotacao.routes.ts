import { Router } from 'express';
import { AnotacaoController } from '../controllers/anotacao.controller';
import { AnotacaoRepository } from '../repositories/anotacao.repository';
import { AnotacaoService } from '../services/anotacao.service';
import { validarParamNumerico, exigirBody } from '../middlewares/validacao';

const router = Router();
const controller = new AnotacaoController(
  new AnotacaoService(new AnotacaoRepository()),
);

router.get(
  '/alunos/:ra/anotacoes',
  validarParamNumerico('ra', 'RA'),
  (req, res, next) => { controller.listar(req, res).catch(next); },
);

router.post(
  '/alunos/:ra/anotacoes',
  validarParamNumerico('ra', 'RA'),
  exigirBody,
  (req, res, next) => { controller.criar(req, res).catch(next); },
);

router.patch(
  '/anotacoes/:id',
  validarParamNumerico('id', 'ID da anotação'),
  exigirBody,
  (req, res, next) => { controller.atualizar(req, res).catch(next); },
);

router.delete(
  '/anotacoes/:id',
  validarParamNumerico('id', 'ID da anotação'),
  (req, res, next) => { controller.remover(req, res).catch(next); },
);

export default router;
