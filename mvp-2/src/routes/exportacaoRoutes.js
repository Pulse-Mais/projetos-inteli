// src/routes/exportacaoRoutes.js

const { Router } = require('express');
const controller = require('../controllers/exportacaoController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();
const LEITURA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

router.use(authenticate);

router.get('/jovens/exportar', authorize(...LEITURA), controller.exportarJovens);
router.get('/eventos/exportar-ical', authorize(...LEITURA), controller.exportarEventosIcal);

module.exports = router;
