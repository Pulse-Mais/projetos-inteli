// src/controllers/competenciaController.js

const competenciaService = require('../services/competenciaService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError, AppError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    if (req.usuario.perfil === 'Aluno') {
        req.body.jovem_id = req.usuario.jovem_id;
    }
    const competencia = await competenciaService.criar(req.body);
    res.status(201).json(competencia);
});

const listar = asyncHandler(async (req, res) => {
    const { tipo, nivel } = req.query;
    const jovem_id = req.usuario.perfil === 'Aluno'
        ? req.usuario.jovem_id
        : req.query.jovem_id;
    const competencias = await competenciaService.listarTodos({ jovem_id, tipo, nivel });
    res.json(competencias);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const competencia = await competenciaService.buscarPorId(id);
    res.json(competencia);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    if (req.usuario.perfil === 'Aluno') {
        const registro = await competenciaService.buscarPorId(id);
        if (Number(registro.jovem_id) !== Number(req.usuario.jovem_id))
            throw new AppError('Acesso negado', 403);
    }
    const competencia = await competenciaService.atualizar(id, req.body);
    res.json(competencia);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    if (req.usuario.perfil === 'Aluno') {
        const registro = await competenciaService.buscarPorId(id);
        if (Number(registro.jovem_id) !== Number(req.usuario.jovem_id))
            throw new AppError('Acesso negado', 403);
    }
    await competenciaService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };