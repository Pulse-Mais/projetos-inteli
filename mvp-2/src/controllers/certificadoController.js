// src/controllers/certificadoController.js

const certificadoService = require('../services/certificadoService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const { AppError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    if (req.usuario.perfil === 'Aluno') {
        req.body.jovem_id = req.usuario.jovem_id;
    }
    const certificado = await certificadoService.criar(req.body);
    res.status(201).json(certificado);
});

const listar = asyncHandler(async (req, res) => {
    const { jovem_id } = req.query;
    const certificados = await certificadoService.listarTodos({ jovem_id });
    res.json(certificados);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const certificado = await certificadoService.buscarPorId(id);
    res.json(certificado);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const certificado = await certificadoService.atualizar(id, req.body);
    res.json(certificado);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await certificadoService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };
