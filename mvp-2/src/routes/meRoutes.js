// src/routes/meRoutes.js

const { Router } = require('express');
const controller = require('../controllers/meController');
const { authenticate } = require('../middlewares/authenticate');

const router = Router();

router.use(authenticate);

router.get('/', controller.obterPerfil);
router.put('/', controller.atualizarPerfil);
router.put('/password', controller.alterarSenha);

module.exports = router;
