import { Router } from "express";
import * as ctrl from "../controllers/matriculaController";

export const matriculaRoutes = Router();

// Listagem geral e criação
matriculaRoutes.get("/", ctrl.listar);
matriculaRoutes.post("/", ctrl.criar);

// Filtros por aluno ou programa
matriculaRoutes.get("/aluno/:id_aluno", ctrl.listarPorAluno);
matriculaRoutes.get("/programa/:id_programa", ctrl.listarPorPrograma);

// Operações sobre matrícula específica (chave composta: programa + aluno)
matriculaRoutes.get("/:id_programa/:id_aluno", ctrl.buscar);
matriculaRoutes.put("/:id_programa/:id_aluno", ctrl.atualizar);
matriculaRoutes.delete("/:id_programa/:id_aluno", ctrl.deletar);
