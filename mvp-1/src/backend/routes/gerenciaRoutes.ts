import { Router } from "express";
import * as ctrl from "../controllers/gerenciaController";

export const gerenciaRoutes = Router();

// Listagem geral e criação
gerenciaRoutes.get("/", ctrl.listar);
gerenciaRoutes.post("/", ctrl.criar);

// Filtros
gerenciaRoutes.get("/programa/:id_programa", ctrl.listarPorPrograma);
gerenciaRoutes.get("/coordenador/:id_coordenador", ctrl.listarPorCoordenador);

// Remoção de vínculo específico (chave composta: coordenador + programa)
gerenciaRoutes.delete("/:id_coordenador/:id_programa", ctrl.deletar);
