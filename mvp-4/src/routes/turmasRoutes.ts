import express from 'express';
import TurmasController from '../controllers/turmasController';
import FrequenciaController from '../controllers/frequenciaController';

const router = express.Router();

// RF006 — Gestão de Turmas
router.get('/gestao/turmas', TurmasController.listar.bind(TurmasController));
router.get('/gestao/turmas/:id', TurmasController.buscarPorId.bind(TurmasController));
router.post('/gestao/turmas', TurmasController.criar.bind(TurmasController));
router.put('/gestao/turmas/:id', TurmasController.atualizar.bind(TurmasController));
router.post('/gestao/turmas/:id/alunos', TurmasController.associarAluno.bind(TurmasController));

// RF008 — Frequência por turma (rota de gestão de turmas)
router.get('/gestao/turmas/:id/frequencia', FrequenciaController.getFrequenciaTurma.bind(FrequenciaController));

export default router;
