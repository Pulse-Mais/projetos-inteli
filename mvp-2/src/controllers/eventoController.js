// src/controllers/eventoController.js

// Aqui, importamos o service responsável pelas regras de negócio de eventos.
const eventoService = require('../services/eventoService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente.
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos.
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro usada para requisições inválidas.
const { BadRequestError } = require('../errors/AppError');

// Aqui, criamos o método responsável por cadastrar um novo evento.
const criar = asyncHandler(async (req, res) => {
    const evento = await eventoService.criar(req.body);
    res.status(201).json(evento);
});

// Aqui, criamos o método responsável por listar eventos.
const listar = asyncHandler(async (req, res) => {
    const { nome, tipo, local, data_inicio, data_fim } = req.query;

    const eventos = await eventoService.listarTodos({
        nome,
        tipo,
        local,
        data_inicio,
        data_fim
    });

    res.json(eventos);
});

// Aqui, criamos o método responsável por buscar um evento pelo ID.
const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const evento = await eventoService.buscarPorId(id);
    res.json(evento);
});

// Aqui, criamos o método responsável por atualizar um evento.
const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const evento = await eventoService.atualizar(id, req.body);
    res.json(evento);
});

// Aqui, criamos o método responsável por excluir um evento.
const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await eventoService.excluir(id);
    res.status(204).send();
});

// Aqui, exportamos todos os métodos do controller para serem utilizados nas rotas.
module.exports = {
    criar,
    listar,
    buscarPorId,
    atualizar,
    excluir
};
