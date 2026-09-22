// src/routes/eventoRoutes.js

const { Router } = require('express');
const controller = require('../controllers/eventoController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os perfis permitidos para criar e atualizar eventos.
const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

// Aqui, definimos os perfis permitidos para excluir eventos.
const EXCLUSAO = ['GestaoGeral', 'Coordenacao'];

// Aqui, protegemos todas as rotas exigindo autenticação.
router.use(authenticate);

// Aqui, criamos um evento permitindo apenas perfis autorizados.
router.post('/', authorize(...ESCRITA), controller.criar);

// Aqui, listamos eventos para usuários autenticados.
router.get('/', controller.listar);

// Aqui, buscamos um evento pelo ID para usuários autenticados.
router.get('/:id', controller.buscarPorId);

// Aqui, atualizamos um evento permitindo apenas perfis autorizados.
router.put('/:id', authorize(...ESCRITA), controller.atualizar);

// Aqui, excluímos um evento permitindo apenas perfis autorizados.
router.delete('/:id', authorize(...EXCLUSAO), controller.excluir);

module.exports = router;
