import { Router, Request, Response, NextFunction } from 'express';
import { EmpregoController } from '../controllers/emprego.controller';
import { validarParamNumerico, exigirBody } from '../middlewares/validacao';

const router = Router();

router.post(
  '/alunos/:ra/emprego',
  validarParamNumerico('ra', 'RA'),
  exigirBody,
  (req: Request, res: Response, next: NextFunction) =>
    EmpregoController.registrarEmprego(req, res).catch(next),
);

router.get(
  '/alunos/:ra/emprego',
  validarParamNumerico('ra', 'RA'),
  (req: Request, res: Response, next: NextFunction) =>
    EmpregoController.listarEmpregos(req, res).catch(next),
);

router.patch(
  '/alunos/:ra/emprego/:id_emprego',
  validarParamNumerico('ra', 'RA'),
  validarParamNumerico('id_emprego', 'ID do emprego'),
  exigirBody,
  (req: Request, res: Response, next: NextFunction) =>
    EmpregoController.encerrarEmprego(req, res).catch(next),
);

export default router;
