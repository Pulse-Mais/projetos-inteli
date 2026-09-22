// src/controllers/ensinoSuperiorController.js

const ensinoSuperiorService = require('../services/ensinoSuperiorService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError, AppError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    if (req.usuario.perfil === 'Aluno') {
        req.body.jovem_id = req.usuario.jovem_id;
    }
    const registro = await ensinoSuperiorService.criar(req.body);
    res.status(201).json(registro);
});

const listar = asyncHandler(async (req, res) => {
    const { jovem_id, status } = req.query;
    const registros = await ensinoSuperiorService.listarTodos({ jovem_id, status });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const registro = await ensinoSuperiorService.buscarPorId(id);
    res.json(registro);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    if (req.usuario.perfil === 'Aluno') {
        const existente = await ensinoSuperiorService.buscarPorId(id);
        if (!existente || Number(existente.jovem_id) !== Number(req.usuario.jovem_id)) {
            throw new AppError('Acesso negado', 403);
        }
    }

    const registro = await ensinoSuperiorService.atualizar(id, req.body);
    res.json(registro);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await ensinoSuperiorService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir};