// src/routes/importacaoRoutes.js

const { Router } = require('express');
const controller = require('../controllers/importacaoController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const { upload } = require('../middlewares/uploadMiddleware');

const router = Router();
const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];

router.use(authenticate);

router.post('/importar-csv', authorize(...ESCRITA), upload.single('arquivo'), controller.previewCsv);
router.post('/confirmar-importacao', authorize(...ESCRITA), controller.confirmarImportacao);

module.exports = router;