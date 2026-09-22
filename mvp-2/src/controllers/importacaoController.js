// src/controllers/importacaoController.js

const importacaoService = require('../services/importacaoService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { BadRequestError } = require('../errors/AppError');

const previewCsv = asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Arquivo CSV não enviado');
    const resultado = await importacaoService.previewCsv(req.file.buffer);
    res.json(resultado);
});

const confirmarImportacao = asyncHandler(async (req, res) => {
    const { registros } = req.body;
    if (!Array.isArray(registros)) throw new BadRequestError('registros deve ser um array');
    const resultado = await importacaoService.confirmarImportacao(registros, req.usuario.id);
    res.status(201).json(resultado);
});

module.exports = { previewCsv, confirmarImportacao };