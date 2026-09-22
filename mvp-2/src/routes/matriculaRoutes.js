// src/routes/matriculaRoutes.js

const { Router } = require('express');
const controller = require('../controllers/matriculaController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];
const EXCLUSAO = ['GestaoGeral', 'Coordenacao'];

router.use(authenticate);

router.post('/', authorize(...ESCRITA), controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', authorize(...ESCRITA), controller.atualizar);
router.delete('/:id', authorize(...EXCLUSAO), controller.excluir);

module.exports = router;