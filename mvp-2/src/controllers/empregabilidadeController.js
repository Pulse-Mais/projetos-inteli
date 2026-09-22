// src/controllers/empregabilidadeController.js

const empregabilidadeServices = require('../services/empregabilidadeService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError, AppError } = require('../errors/AppError');

const criar = asyncHandler(async (req, res) => {
    if (req.usuario.perfil === 'Aluno') {
        req.body.jovem_id = req.usuario.jovem_id;
    }
    const empregabilidade = await empregabilidadeServices.criar(req.body);
    res.status(201).json(empregabilidade);
});

const listar = asyncHandler(async (req, res) => {
    const { ativo, tipo_vinculo } = req.query;
    const jovem_id = req.usuario.perfil === 'Aluno'
        ? req.usuario.jovem_id
        : req.query.jovem_id;
    const registros = await empregabilidadeServices.listarTodos({ jovem_id, ativo, tipo_vinculo });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const empregabilidade = await empregabilidadeServices.buscarPorId(id);
    res.json(empregabilidade);
});

const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    if (req.usuario.perfil === 'Aluno') {
        const registro = await empregabilidadeServices.buscarPorId(id);
        if (!registro || Number(registro.jovem_id) !== Number(req.usuario.jovem_id)) {
            throw new AppError('Acesso negado', 403);
        }
    }

    const empregabilidade = await empregabilidadeServices.atualizar(id, req.body);
    res.json(empregabilidade);
});

const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    if (req.usuario.perfil === 'Aluno') {
        const registro = await empregabilidadeServices.buscarPorId(id);
        if (Number(registro.jovem_id) !== Number(req.usuario.jovem_id))
            throw new AppError('Acesso negado', 403);
    }

    await empregabilidadeServices.excluir(id);
    res.status(204).send();
});

const arquivar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const empregabilidade = await empregabilidadeServices.arquivar(id);
    res.json(empregabilidade);
});

module.exports = { criar, listar, buscarPorId, atualizar, excluir, arquivar };