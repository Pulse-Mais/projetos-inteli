import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardService } from '../services/dashboard.service';

const router = Router();
const repository = new DashboardRepository();
const service = new DashboardService(repository);
const controller = new DashboardController(service);

// GET /dashboard - RF010
router.get('/dashboard', (req, res, next) => {
  console.log('[ROUTE] GET /dashboard - Requisicao recebida', { query: req.query });
  controller.obterDashboard(req, res).catch(next);
});

// GET /dashboard/frequencia - RF010
router.get('/dashboard/frequencia', (req, res, next) => {
  console.log('[ROUTE] GET /dashboard/frequencia - Requisicao recebida', { query: req.query });
  controller.obterFrequenciasDashboard(req, res).catch(next);
});

// GET /dashboard/empregabilidade - RF010
router.get('/dashboard/empregabilidade', (req, res, next) => {
  console.log('[ROUTE] GET /dashboard/empregabilidade - Requisicao recebida', { query: req.query });
  controller.obterEmpregabilidadeDashboard(req, res).catch(next);
});

// GET /gestao/alertas - RF011
router.get('/gestao/alertas', (req, res, next) => {
  console.log('[ROUTE] GET /gestao/alertas - Requisicao recebida', { query: req.query });
  controller.obterAlertasEvasao(req, res).catch(next);
});

router.patch('/gestao/alertas/:id/resolver', (req, res, next) => {
  controller.resolverAlerta(req, res).catch(next);
});

export default router;
