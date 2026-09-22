// src/controllers/jovemController.js

const jovemService = require('../services/jovemService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const jovem = await jovemService.criar(req.body);
    res.status(201).json(jovem);
});

const listar = asyncHandler(async (req, res) => {
    const { status_jornada, status_empregabilidade, multiplicador, programa, ativo, nome } = req.query;
    const jovens = await jovemService.listarTodos({ status_jornada, status_empregabilidade, multiplicador, programa, ativo, nome });
    res.json(jovens);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const jovem = await jovemService.buscarPorId(id, req.usuario);
    res.json(jovem);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const jovem = await jovemService.atualizar(id, req.body);
    res.json(jovem);
});

const arquivar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const jovem = await jovemService.arquivar(id);
    res.json(jovem);
});

const ficha = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const dados = await jovemService.buscarFicha(id);
    res.json(dados);
});


module.exports = { criar, listar, buscarPorId, atualizar, arquivar, ficha };