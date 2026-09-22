// src/routes/dashboardRoutes.js

const { Router } = require('express');
const controller = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

const LEITURA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

router.use(authenticate);

router.get('/', authorize(...LEITURA), controller.obterKPIs);
router.get('/jovens-em-risco', authorize(...LEITURA), controller.jovemEmRisco);
router.get('/mentor', authorize('GestaoGeral', 'Coordenacao', 'Assistente', 'Mentor'), controller.mentorDashboard);
router.get('/aluno/:jovem_id', authorize('GestaoGeral', 'Coordenacao', 'Assistente', 'Mentor', 'Aluno'), controller.alunoDashboard);

module.exports = router;