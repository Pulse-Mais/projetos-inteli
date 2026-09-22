import express from 'express';
import path from 'path';

import { errorHandler } from './middlewares/errorHandler';
import { pool } from './db/migrations/connection';

import { usuarioRoutes } from './routes/usuarioRoutes';
import { alunoRoutes } from './routes/alunoRoutes';
import { eventoRoutes } from './routes/eventoRoutes';
import { mentoriaRoutes } from './routes/mentoriaRoutes';
import { mentorRoutes } from './routes/mentorRoutes';
import { programaRoutes } from './routes/programaRoutes';
import { acompanhaRoutes } from './routes/acompanhaRoutes';
import { indicadorRoutes } from './routes/indicadorRoutes';
import { avaliacaoRoutes } from './routes/avaliacaoRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { atividadeRoutes } from './routes/atividadeRoutes';
import { importacaoRoutes } from './routes/importacaoRoutes';
import { matriculaRoutes } from './routes/matriculaRoutes';
import { participaEventoRoutes } from './routes/participaEventoRoutes';
import { gerenciaRoutes } from './routes/gerenciaRoutes';
import { anotacaoPrivadaRoutes } from './routes/anotacaoPrivadaRoutes';
import { oportunidadeRoutes } from './routes/oportunidadeRoutes';
import { frequenciaRoutes } from './routes/frequenciaRoutes';
import { authRoutes } from './routes/authRoutes';
import { localidadeRoutes } from './routes/localidadeRoutes';
import { cursoRoutes } from './routes/cursoRoutes';
import { aulaRoutes } from './routes/aulaRoutes';

import { apiDocsHtml } from './docs/apiDocs';

const app = express();

app.use(express.json({ limit: '5mb' }));

// Servir arquivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

/**
 * Health check da aplicação.
 *
 * Verifica a conexão com o PostgreSQL local através do pool.
 */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      db: 'connected',
      project: 'Pulse Mais G01',
    });
  } catch (err) {
    console.error('[health] PostgreSQL local indisponível:', err);

    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      project: 'Pulse Mais G01',
    });
  }
});

app.use('/auth', authRoutes);

app.use('/usuarios', usuarioRoutes);
app.use('/alunos', alunoRoutes);
app.use('/eventos', eventoRoutes);
app.use('/mentorias', mentoriaRoutes);
app.use('/mentores', mentorRoutes);
app.use('/programas', programaRoutes);
app.use('/acompanha', acompanhaRoutes);
app.use('/indicadores', indicadorRoutes);
app.use('/avaliacoes', avaliacaoRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/atividades', atividadeRoutes);
app.use('/importacao', importacaoRoutes);
app.use('/matriculas', matriculaRoutes);
app.use('/participacoes-evento', participaEventoRoutes);
app.use('/gerencias', gerenciaRoutes);
app.use('/anotacoes', anotacaoPrivadaRoutes);
app.use('/oportunidades', oportunidadeRoutes);
app.use('/frequencia', frequenciaRoutes);
app.use('/localidades', localidadeRoutes);
app.use('/cursos', cursoRoutes);
app.use('/aulas', aulaRoutes);

app.get('/docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(apiDocsHtml);
});

app.use(errorHandler);

export { app };