// src/controllers/disciplinaController.js

const disciplinaService = require('../services/disciplinaService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    const disciplina = await disciplinaService.criar(req.body);
    res.status(201).json(disciplina);
});

const listar = asyncHandler(async (req, res) => {
    const { ensino_superior_id, status } = req.query;
    const jovem_id = req.usuario.perfil === 'Aluno'
        ? req.usuario.jovem_id
        : req.query.jovem_id;
    const disciplinas = await disciplinaService.listarTodos({ ensino_superior_id, jovem_id, status });
    res.json(disciplinas);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const disciplina = await disciplinaService.buscarPorId(id);
    res.json(disciplina);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    const disciplina = await disciplinaService.atualizar(id, req.body);
    res.json(disciplina);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');
    await disciplinaService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir };
