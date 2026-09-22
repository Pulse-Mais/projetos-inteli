// src/controllers/atividadesController.js

const atividadeService = require('../services/atividadeService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const registro = await atividadeService.criar(req.body);
    res.status(201).json(registro);
});

const listar = asyncHandler(async (req, res) => {
    const { programa_id } = req.query;
    const registros = await atividadeService.listarTodos({ programa_id });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const registro = await atividadeService.buscarPorId(id);
    res.json(registro);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const registro = await atividadeService.atualizar(id, req.body);
    res.json(registro);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await atividadeService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };