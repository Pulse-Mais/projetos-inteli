// src/routes/empregabilidadeRoutes.js

const { Router } = require('express');
const controller = require('../controllers/empregabilidadeController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = Router();

const ESCRITA = ['GestaoGeral', 'Coordenacao', 'Assistente'];
const ARQUIVAMENTO = ['GestaoGeral', 'Coordenacao'];

router.use(authenticate);

router.post('/', authorize(...ESCRITA, 'Aluno'), controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', authorize(...ESCRITA, 'Aluno'), controller.atualizar);
router.delete('/:id', authorize(...ESCRITA, 'Aluno'), controller.excluir);
router.patch('/:id/arquivar', authorize(...ARQUIVAMENTO), controller.arquivar);

module.exports = router;