import { Router } from "express";
import * as ctrl from "../controllers/acompanhaController";

const router = Router();

router.post("/", ctrl.criar);
router.delete(
  "/mentor/:id_mentor/aluno/:id_aluno/programa/:id_programa",
  ctrl.remover,
);
router.get("/aluno/:id_aluno", ctrl.listarPorAluno);

export { router as acompanhaRoutes };
