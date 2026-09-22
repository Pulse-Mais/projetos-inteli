// src/routes/saudeMentalRoutes.js

const { Router } = require('express');
const controller = require('../controllers/saudeMentalController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os perfis permitidos para acessar dados de saúde mental.
const ACESSO_RESTRITO = ['GestaoGeral', 'Coordenacao', 'Psicologa'];

// Aqui, protegemos todas as rotas exigindo autenticação.
router.use(authenticate);

// Aqui, criamos um atendimento permitindo apenas perfis autorizados.
router.post('/', authorize(...ACESSO_RESTRITO), controller.criar);

// Aqui, listamos atendimentos permitindo apenas perfis autorizados.
router.get('/', authorize(...ACESSO_RESTRITO), controller.listar);

// Aqui, buscamos um atendimento pelo ID permitindo apenas perfis autorizados.
router.get('/:id', authorize(...ACESSO_RESTRITO), controller.buscarPorId);

// Aqui, atualizamos um atendimento permitindo apenas perfis autorizados.
router.put('/:id', authorize(...ACESSO_RESTRITO), controller.atualizar);

// Aqui, excluímos um atendimento permitindo apenas perfis autorizados.
router.delete('/:id', authorize(...ACESSO_RESTRITO), controller.excluir);

module.exports = router;
