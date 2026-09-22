import { Router } from "express";
import * as ctrl from "../controllers/anotacaoPrivadaController";

export const anotacaoPrivadaRoutes = Router();

// RF012 — criar anotação qualitativa
anotacaoPrivadaRoutes.post("/", ctrl.criar);

// RN13 — coordenador: todas as anotações de um aluno (todos os mentores)
anotacaoPrivadaRoutes.get("/aluno/:id_aluno", ctrl.listarPorAluno);

// RN13 — mentor: apenas suas próprias anotações sobre um aluno
anotacaoPrivadaRoutes.get(
  "/aluno/:id_aluno/mentor/:id_mentor",
  ctrl.listarPorAlunoEMentor,
);

// Mentor consulta todas as suas anotações (RF013 — área somente leitura)
anotacaoPrivadaRoutes.get("/mentor/:id_mentor", ctrl.listarPorMentor);

// RN13 — remoção: ?data=<ISO timestamp>
anotacaoPrivadaRoutes.delete(
  "/mentor/:id_mentor/aluno/:id_aluno",
  ctrl.deletar,
);
