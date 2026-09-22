import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import jovemRoutes from './jovemRoutes';
import frequenciaRoutes from './frequenciaRoutes';
import dashboardRoutes from './dashboardRoutes';
import registroRoutes from './registroRoutes';
import { programaRouter, inscricaoRouter } from './programaRoutes';
import { mentorRouter, sessaoRouter } from './mentoriaRoutes';
import importRouter from './importRoutes';
import exportRouter from './exportRoutes';
import empregabilidadeRoutes from './empregabilidadeRoutes';
import ensinoSuperiorRoutes from './ensinoSuperiorRoutes';
import eventoRoutes from './eventoRoutes';
import historicoRoutes from './historicoRoutes';
import aulaRoutes from './aulaRoutes';

const api = Router();

api.use('/usuarios', usuarioRoutes);
api.use('/jovens', jovemRoutes);

// Registros de acompanhamento — mergeParams acessa :id do path pai.
api.use('/jovens/:id/prontuario', registroRoutes);

// Inscrições em programas — mergeParams acessa :id do jovem.
api.use('/jovens/:id/inscricoes', inscricaoRouter);

api.use('/frequencia', frequenciaRoutes);
api.use('/dashboard', dashboardRoutes);

api.use('/programas', programaRouter);
api.use('/mentor', mentorRouter);
api.use('/mentorias', sessaoRouter);

api.use('/import', importRouter);
api.use('/export', exportRouter);

api.use('/jovens/:id/empregabilidade', empregabilidadeRoutes);
api.use('/jovens/:id/ensino-superior', ensinoSuperiorRoutes);
api.use('/eventos', eventoRoutes);
api.use('/historico', historicoRoutes);
api.use('/aulas', aulaRoutes);

export default api;
