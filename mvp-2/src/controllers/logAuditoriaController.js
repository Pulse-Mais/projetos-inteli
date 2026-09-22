// src/controllers/logAuditoriaController.js

const logAuditoriaService = require('../services/logAuditoriaService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { parsePositiveInt } = require('../helpers/parseId');
const { BadRequestError } = require('../errors/AppError');

const listar = asyncHandler(async (req, res) => {
    const { usuario_id, entidade, operacao, data_inicio, data_fim } = req.query;
    const registros = await logAuditoriaService.listarTodos({
        usuario_id, entidade, operacao, data_inicio, data_fim
    });
    res.json(registros);
});

const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const registro = await logAuditoriaService.buscarPorId(id);
    res.json(registro);
});

module.exports = { listar, buscarPorId };