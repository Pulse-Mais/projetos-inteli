import { Router } from "express";
import * as ctrl from "../controllers/mentorController";

export const mentorRoutes = Router();

mentorRoutes.get("/", ctrl.listar);
mentorRoutes.get("/:id/mentorandos", ctrl.listarMentorandos);
mentorRoutes.get("/:id/mentorias", ctrl.listarMentorias);
mentorRoutes.get("/:id", ctrl.buscar);
mentorRoutes.post("/", ctrl.criar);
mentorRoutes.put("/:id", ctrl.atualizar);
mentorRoutes.delete("/:id", ctrl.inativar);
