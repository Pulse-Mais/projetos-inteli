// src/routes/usuarioRoutes.js

const { Router } = require('express');
const controller = require('../controllers/usuarioController');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os perfis permitidos para gerenciar usuários.
const ADMINISTRACAO = ['GestaoGeral', 'Coordenacao'];

// Aqui, protegemos todas as rotas exigindo autenticação.
router.use(authenticate);

// Aqui, criamos um usuário permitindo apenas perfis administrativos.
router.post('/', authorize(...ADMINISTRACAO), controller.criar);

// Aqui, listamos usuários permitindo apenas perfis administrativos.
router.get('/', authorize(...ADMINISTRACAO), controller.listar);

// Aqui, buscamos um usuário pelo ID permitindo apenas perfis administrativos.
router.get('/:id', authorize(...ADMINISTRACAO), controller.buscarPorId);

// Aqui, atualizamos um usuário permitindo apenas perfis administrativos.
router.put('/:id', authorize(...ADMINISTRACAO), controller.atualizar);

// Aqui, desativamos um usuário permitindo apenas perfis administrativos.
router.patch('/:id/desativar', authorize(...ADMINISTRACAO), controller.desativar);

// Aqui, reativamos um usuário permitindo apenas perfis administrativos.
router.patch('/:id/reativar', authorize(...ADMINISTRACAO), controller.reativar);

router.delete('/me', authController.desativarConta);

// Aqui, excluímos um usuário permitindo apenas perfis administrativos.
router.delete('/:id', authorize(...ADMINISTRACAO), controller.excluir);

module.exports = router;
