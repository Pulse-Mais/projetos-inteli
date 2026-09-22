import express from 'express';
import JornadaController from '../controllers/jornadaController';

const router = express.Router();

// RF007 — Jornada do Aluno
router.get('/aluno/:ra/jornada', JornadaController.getJornada.bind(JornadaController));
router.get('/aluno/:ra/certificados', JornadaController.getCertificados.bind(JornadaController));

// RF012 - Alertas de Frequencia no Portal do Aluno
router.get('/aluno/:ra/alertas', (req, res) => {
  console.log('[ROUTE] GET /aluno/:ra/alertas - Requisicao recebida', { ra: req.params.ra });
  JornadaController.getAlertas(req, res);
});

export default router;
