import express from 'express';
import FrequenciaController from '../controllers/frequenciaController';

const router = express.Router();

// RF008 — Registro de Frequência em Aulas e Eventos
router.post('/gestao/alunos/:ra/frequencia/aulas', FrequenciaController.registrarAula.bind(FrequenciaController));
router.get('/gestao/alunos/:ra/frequencia/aulas', FrequenciaController.getFrequenciaAulas.bind(FrequenciaController));
router.post('/gestao/alunos/:ra/frequencia/eventos', FrequenciaController.registrarEvento.bind(FrequenciaController));

export default router;
