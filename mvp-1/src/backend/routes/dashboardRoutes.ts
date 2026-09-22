import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';

const dashboardRoutes = Router();

dashboardRoutes.get('/', getDashboard);

export { dashboardRoutes };
