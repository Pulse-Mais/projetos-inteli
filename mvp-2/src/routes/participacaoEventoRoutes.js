// src/routes/participacaoEventoRoutes.js

// Aqui, importamos o Router do Express para definir as rotas de participação em eventos.
const { Router } = require('express');

// Aqui, importamos o controller responsável por receber as requisições HTTP.
const controller = require('../controllers/participacaoEventoController');

// Aqui, importamos os middlewares de autenticação e autorização.
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Aqui, definimos os perfis permitidos para criar e atualizar participações em eventos.
const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

// Aqui, definimos os perfis permitidos para excluir participações em eventos.
const EXCLUSAO = ['GestaoGeral', 'Coordenacao'];

// Aqui, protegemos todas as rotas exigindo autenticação.
router.use(authenticate);

// Aqui, registramos uma participação em evento permitindo apenas perfis autorizados.
router.post('/', authorize(...ESCRITA), controller.criar);

// Aqui, listamos participações com filtros opcionais.
router.get('/', controller.listar);

// Aqui, listamos o histórico de eventos de um jovem.
router.get('/jovem/:jovem_id', controller.listarPorJovem);

// Aqui, listamos os participantes de um evento.
router.get('/evento/:evento_id', controller.listarPorEvento);

// Aqui, buscamos uma participação pelo ID.
router.get('/:id', controller.buscarPorId);

// Aqui, atualizamos uma participação permitindo apenas perfis autorizados.
router.put('/:id', authorize(...ESCRITA), controller.atualizar);

// Aqui, excluímos uma participação permitindo apenas perfis autorizados.
router.delete('/:id', authorize(...EXCLUSAO), controller.excluir);

// Aqui, exportamos as rotas de participação em eventos.
module.exports = router;
