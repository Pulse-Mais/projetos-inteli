// src/controllers/matriculaController.js

const matriculaService = require('../services/matriculaService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const registro = await matriculaService.criar(req.body);
    res.status(201).json(registro);
});

const listar = asyncHandler(async (req, res) => {
    const { jovem_id, programa_id, status, turma } = req.query;
    const registros = await matriculaService.listarTodos({ jovem_id, programa_id, status, turma });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await matriculaService.buscarPorId(id);
    res.json(registro);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const registro = await matriculaService.atualizar(id, req.body);
    res.json(registro);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await matriculaService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };