// src/routes/programaRoutes.js

const { Router } = require('express');
const controller = require('../controllers/programaController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os perfis permitidos para criar e atualizar programas.
const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

// Aqui, definimos os perfis permitidos para arquivar programas.
const ARQUIVAMENTO = ['GestaoGeral', 'Coordenacao'];

// Aqui, protegemos todas as rotas exigindo autenticação.
router.use(authenticate);

// Aqui, criamos um programa permitindo apenas perfis autorizados.
router.post('/', authorize(...ESCRITA), controller.criar);

// Aqui, listamos programas para usuários autenticados.
router.get('/', controller.listar);

// Aqui, buscamos um programa pelo ID para usuários autenticados.
router.get('/:id', controller.buscarPorId);

// Aqui, atualizamos um programa permitindo apenas perfis autorizados.
router.put('/:id', authorize(...ESCRITA), controller.atualizar);

// Aqui, arquivamos um programa permitindo apenas perfis autorizados.
router.patch('/:id/arquivar', authorize(...ARQUIVAMENTO), controller.arquivar);

module.exports = router;
