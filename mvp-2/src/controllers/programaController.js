// src/controllers/programaController.js

// Aqui, importamos o service responsável pelas regras de negócio de programas.
const programaService = require('../services/programaService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente.
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos.
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro usada para requisições inválidas.
const { BadRequestError } = require('../errors/AppError');

// Aqui, criamos o método responsável por cadastrar um novo programa.
const criar = asyncHandler(async (req, res) => {
    const programa = await programaService.criar(req.body);
    res.status(201).json(programa);
});

// Aqui, criamos o método responsável por listar programas.
const listar = asyncHandler(async (req, res) => {
    const { nome, ano, tipo, coorte, ativo } = req.query;

    const programas = await programaService.listarTodos({
        nome,
        ano,
        tipo,
        coorte,
        ativo
    });

    res.json(programas);
});

// Aqui, criamos o método responsável por buscar um programa pelo ID.
const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const programa = await programaService.buscarPorId(id);
    res.json(programa);
});

// Aqui, criamos o método responsável por atualizar um programa.
const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const programa = await programaService.atualizar(id, req.body);
    res.json(programa);
});

// Aqui, criamos o método responsável por arquivar um programa.
const arquivar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const programa = await programaService.arquivar(id);
    res.json(programa);
});

// Aqui, exportamos todos os métodos do controller para serem utilizados nas rotas.
module.exports = {
    criar,
    listar,
    buscarPorId,
    atualizar,
    arquivar
};
