// src/routes/authRoutes.js

const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authenticate');

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/cadastro', authController.cadastrar);
router.post('/logout-all', authenticate, authController.logoutAll);
router.delete('/me', authenticate, authController.desativarConta);

module.exports = router;