// src/controllers/entregaAtividadeController.js

const entregaAtividadeService = require('../services/entregaAtividadeService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const registro = await entregaAtividadeService.criar(req.body);
    res.status(201).json(registro);
});

const listar = asyncHandler(async (req, res) => {
    const { atividades_id, jovem_id, status } = req.query;
    const registros = await entregaAtividadeService.listarTodos({ atividades_id, jovem_id, status});
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await entregaAtividadeService.buscarPorId(id);
    res.json(registro);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await entregaAtividadeService.atualizar(id, req.body);
    res.json(registro);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await entregaAtividadeService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };