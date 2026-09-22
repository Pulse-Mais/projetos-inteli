// src/controllers/anotacaoController.js

const anotacaoService = require('../services/anotacaoService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    // autor_id é sempre o usuário logado - não aceita do body
    const dados = {...req.body, autor_id: req.usuario.id };
    const anotacao = await anotacaoService.criar(dados);
    res.status(201).json(anotacao);
});

const listar = asyncHandler(async (req, res) => {
    const { jovem_id, categoria, tipo_alerta } = req.query;
    const perfil = req.usuario.perfil;
    const anotacoes = await anotacaoService.listarTodos({ jovem_id, categoria, tipo_alerta, perfil });
    res.json(anotacoes);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const anotacao = await anotacaoService.buscarPorId(id);
    res.json(anotacao);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const anotacao = await anotacaoService.atualizar(id, req.body);
    res.json(anotacao);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await anotacaoService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };