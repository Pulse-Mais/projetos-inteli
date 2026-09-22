// src/controllers/frequenciaController.js

const frequenciaService    = require('../services/frequenciaService');
const { asyncHandler }     = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError }  = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    // responsavel_id é sempre o usuário logado — não aceita do body
    const dados = { ...req.body, responsavel_id: req.usuario.id };
    const frequencia = await frequenciaService.criar(dados);
    res.status(201).json(frequencia);
});

const listar = asyncHandler(async (req, res) => {
    const { jovem_id, data_aula, tipo_presenca, programa_id } = req.query;
    const frequencias = await frequenciaService.listarTodos({ jovem_id, data_aula, tipo_presenca, programa_id });
    res.json(frequencias);
});

const resumo = asyncHandler(async (req, res) => {
    const programa_id = parsePositiveInt(req.query.programa_id) || null;
    const dados = await frequenciaService.resumoPorJovem(programa_id);
    res.json(dados);
});

const listarAlunosPrograma = asyncHandler(async (req, res) => {
    const { programa_id, data_aula, turma } = req.query;
    const alunos = await frequenciaService.listarAlunosPrograma({ programa_id, data_aula, turma });
    res.json(alunos);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const frequencia = await frequenciaService.buscarPorId(id);
    res.json(frequencia);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const frequencia = await frequenciaService.atualizar(id, req.body);
    res.json(frequencia);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await frequenciaService.excluir(id);
    res.status(204).send();
});

module.exports = { criar, listar, resumo, listarAlunosPrograma, buscarPorId, atualizar, excluir };
