// src/routes/index.js

const { Router } = require('express');
const jovensRoutes = require('./jovemRoutes');
const frequenciasRoutes = require('./frequenciaRoutes');
const anotacaoRoutes = require('./anotacaoRoutes');
const empregabilidadeRoutes = require('./empregabilidadeRoutes');
const logAuditoriaRoutes = require('./logAuditoriaRoutes');
const ensinoSuperiorRoutes = require('./ensinoSuperiorRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const atividadesRoutes = require('./atividadesRoutes');
const entregaAtividadesRoutes = require('./entregaAtividadeRoutes');
const notificacaoRoutes = require ('./notificacaoRoutes');
const mentoriaRoutes = require('./mentoriaRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const saudeMentalRoutes = require('./saudeMentalRoutes');
const matriculaRoutes = require('./matriculaRoutes');
const eventoRoutes = require('./eventoRoutes');
const participacaoEventoRoutes = require('./participacaoEventoRoutes');
const programaRoutes = require('./programaRoutes');
const competenciaRoutes = require('./competenciaRoutes');
const authRoutes = require('./authRoutes');
const oportunidadeRoutes = require('./oportunidadeRoutes');
const certificadoRoutes = require('./certificadoRoutes');
const disciplinaRoutes = require('./disciplinaRoutes');
const meRoutes = require('./meRoutes');
const importacaoRoutes = require('./importacaoRoutes');
const exportacaoRoutes = require('./exportacaoRoutes');



const router = Router();

// Rota de health check — útil pra saber se o servidor tá vivo
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
// exportacaoRoutes precisa vir ANTES de /jovens e /eventos: ela define paths
// específicos (/jovens/exportar, /eventos/exportar-ical) que, se registrados
// depois, são interceptados pelas rotas genéricas GET /:id desses módulos.
router.use('/', exportacaoRoutes);
router.use('/jovens', jovensRoutes);
router.use('/frequencias', frequenciasRoutes);
router.use('/anotacoes', anotacaoRoutes);
router.use('/empregabilidade', empregabilidadeRoutes);
router.use('/ensino-superior', ensinoSuperiorRoutes);
router.use('/log-auditoria',   logAuditoriaRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/atividades', atividadesRoutes);
router.use('/entrega-atividades', entregaAtividadesRoutes);
router.use('/notificacoes', notificacaoRoutes);
router.use('/mentorias', mentoriaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/saude-mental', saudeMentalRoutes);
router.use('/matriculas', matriculaRoutes);
router.use('/eventos', eventoRoutes);
router.use('/participacoes-eventos', participacaoEventoRoutes);
router.use('/programas', programaRoutes);
router.use('/competencias', competenciaRoutes);
router.use('/oportunidades', oportunidadeRoutes);
router.use('/certificados', certificadoRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/me', meRoutes);
router.use('/frequencias', importacaoRoutes);

module.exports = router;
