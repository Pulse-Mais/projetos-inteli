import { Router } from "express";
import * as ctrl from "../controllers/participaEventoController";

export const participaEventoRoutes = Router();

// Listagem geral e criação
participaEventoRoutes.get("/", ctrl.listar);
participaEventoRoutes.post("/", ctrl.criar);

// Filtros por evento ou aluno
participaEventoRoutes.get("/evento/:id_evento", ctrl.listarPorEvento);
participaEventoRoutes.get("/aluno/:id_aluno", ctrl.listarPorAluno);

// Operações sobre participação específica (chave composta: evento + aluno)
participaEventoRoutes.get("/:id_evento/:id_aluno", ctrl.buscar);
participaEventoRoutes.put("/:id_evento/:id_aluno", ctrl.atualizar); // RF002 — atualiza presença
participaEventoRoutes.delete("/:id_evento/:id_aluno", ctrl.deletar);
