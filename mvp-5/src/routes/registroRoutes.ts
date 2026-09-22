// Importações e configurações do roteador x
import { Router } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as controller from '../controllers/registroController';

// Definição da variável do roteador 
const router = Router({ mergeParams: true });

// Definição das rotas que mapeiam os endpoints paras suas funções no controller
router.post('/', asyncHandler(controller.criar));
router.get('/', asyncHandler(controller.listar));
router.put('/:registroId', asyncHandler(controller.atualizar));

export default router;