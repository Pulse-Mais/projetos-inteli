// src/routes/logAuditoriaRoutes.js

const { Router } = require('express');
const controller = require('../controllers/logAuditoriaController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

const LEITURA = ['GestaoGeral', 'Coordenacao'];

router.use(authenticate);

router.get('/', authorize(...LEITURA), controller.listar);
router.get('/:id', authorize(...LEITURA), controller.buscarPorId);

module.exports = router;