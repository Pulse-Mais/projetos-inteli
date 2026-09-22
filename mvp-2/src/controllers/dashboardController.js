// src/controllers/dashboardController.js

const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError, AppError } = require('../errors/AppError');

const obterKPIs = asyncHandler(async (req, res) => {
    const programaId = parsePositiveInt(req.query.programa_id) || null;
    const kpis = await dashboardService.obterKPIs(programaId);
    res.json(kpis);
});

const jovemEmRisco = asyncHandler(async (req, res) => {
    const programaId = parsePositiveInt(req.query.programa_id) || null;
    const lista = await dashboardService.obterJovensEmRisco(programaId);
    res.json(lista);
});

const mentorDashboard = asyncHandler(async (req, res) => {
    const dados = await dashboardService.obterDashboardMentor(req.usuario.id);
    res.json(dados);
});

const alunoDashboard = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.jovem_id);
    if (!id) throw new BadRequestError('jovem_id inválido');
    if (req.usuario.perfil === 'Aluno' && Number(req.usuario.jovem_id) !== id) {
        throw new AppError('Acesso negado', 403);
    }
    const dados = await dashboardService.obterDashboardAluno(id);
    res.json(dados);
});


module.exports = { obterKPIs, jovemEmRisco, mentorDashboard, alunoDashboard };
