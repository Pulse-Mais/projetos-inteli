// src/controllers/oportunidadeController.js

const oportunidadeService = require('../services/oportunidadeService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const oportunidade = await oportunidadeService.criar(req.body);
    res.status(201).json(oportunidade);
});

const listar = asyncHandler(async (req, res) => {
    const { tipo, modalidade, ativo } = req.query;
    const oportunidades = await oportunidadeService.listarTodos({ tipo, modalidade, ativo });
    res.json(oportunidades);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const oportunidade = await oportunidadeService.buscarPorId(id);
    res.json(oportunidade);
});

const atualizar = asyncHandler(async (req, res)=> {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const oportunidade = await oportunidadeService.atualizar(id, req.body);
    res.json(oportunidade);
});

const alterarStatus = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const { ativo } = req.body;
    if (typeof ativo !== 'boolean') throw new BadRequestError('Campo "ativo" deve ser boolean');
    const oportunidade = await oportunidadeService.atualizar(id, { ativo });
    res.json(oportunidade);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await oportunidadeService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, alterarStatus, excluir };