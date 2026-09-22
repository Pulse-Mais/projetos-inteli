// src/routes/jovens.js

const { Router } = require('express');
const controller = require('../controllers/jovemController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

// Perfis com permissão de escrita (criar e editar)
const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];
// Só gestão e coordenação podem arquivar
const ARQUIVAMENTO = ['GestaoGeral', 'Coordenacao'];

// authenticate roda em TODAS as rotas deste arquivos
router.use(authenticate);

router.post('/', authorize(...ESCRITA), controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.get('/:id/ficha', controller.ficha);
router.put('/:id', authorize(...ESCRITA), controller.atualizar);
router.patch('/:id/arquivar', authorize(...ARQUIVAMENTO), controller.arquivar);

module.exports = router;
