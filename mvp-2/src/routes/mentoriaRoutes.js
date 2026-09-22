// src/routes/mentoriaRoutes.js

const { Router } = require('express');
const controller = require('../controllers/mentoriaController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os cargos permitidos para criar e atualizar mentorias
const ESCRITA = [ 'GestaoGeral', 'Coordenacao', 'Mentor' ];

// Aqui, definimos os cargos permitidos para excluir mentorias
const EXCLUSAO = [ 'GestaoGeral', 'Coordenacao', 'Mentor' ];


// Aqui, protegemos todas as rotas exigindo autenticação
router.use(authenticate);


// Aqui, criamos uma mentoria permitindo apenas usuários autorizados
router.post('/', authorize(...ESCRITA), controller.criar);


// Aqui, listamos todas as mentorias autenticadas
router.get('/', controller.listar);

// Aqui, buscamos uma mentoria pelo ID
router.get( '/:id', controller.buscarPorId);

// Aqui, atualizamos uma mentoria permitindo apenas usuários autorizados
router.put('/:id', authorize(...ESCRITA), controller.atualizar);

// Aqui, excluímos uma mentoria permitindo apenas usuários autorizados
router.delete( '/:id', authorize(...EXCLUSAO), controller.excluir);

module.exports = router;