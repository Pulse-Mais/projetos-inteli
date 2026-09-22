// src/controllers/notificacaoController.js

const notificacaoService = require('../services/notificacaoService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const registro = await notificacaoService.criar(req.body);
    res.status(201).json(registro);
});

const listar = asyncHandler(async (req, res) => {
    const { usuario_id, tipo, lida } = req.query;
    const registros = await notificacaoService.listarTodos({ usuario_id, tipo, lida });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await notificacaoService.buscarPorId(id);
    res.json(registro);
});

const marcarComoLida = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await notificacaoService.marcarComoLida(id);
    res.json(registro);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await notificacaoService.atualizar(id, req.body);
    res.json(registro);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await notificacaoService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, marcarComoLida, atualizar, excluir };
