// src/controllers/participacaoEventoController.js

// Aqui, importamos o service responsável pelas regras de negócio de participação em eventos.
const participacaoEventoService = require('../services/participacaoEventoService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente.
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos.
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro usada para requisições inválidas.
const { BadRequestError } = require('../errors/AppError');

// Aqui, criamos o método responsável por registrar uma participação em evento.
const criar = asyncHandler(async (req, res) => {
    const participacao = await participacaoEventoService.criar(req.body);
    res.status(201).json(participacao);
});

// Aqui, criamos o método responsável por listar participações com filtros opcionais.
const listar = asyncHandler(async (req, res) => {
    const { jovem_id, evento_id, presente } = req.query;

    const participacoes = await participacaoEventoService.listarTodos({
        jovem_id,
        evento_id,
        presente
    });

    res.json(participacoes);
});

// Aqui, criamos o método responsável por buscar uma participação pelo ID.
const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const participacao = await participacaoEventoService.buscarPorId(id);
    res.json(participacao);
});

// Aqui, criamos o método responsável por listar o histórico de eventos de um jovem.
const listarPorJovem = asyncHandler(async (req, res) => {
    const jovemId = parsePositiveInt(req.params.jovem_id);
    if (!jovemId) throw new BadRequestError('ID do jovem inválido');

    const participacoes = await participacaoEventoService.listarPorJovem(jovemId);
    res.json(participacoes);
});

// Aqui, criamos o método responsável por listar os participantes de um evento.
const listarPorEvento = asyncHandler(async (req, res) => {
    const eventoId = parsePositiveInt(req.params.evento_id);
    if (!eventoId) throw new BadRequestError('ID do evento inválido');

    const participantes = await participacaoEventoService.listarPorEvento(eventoId);
    res.json(participantes);
});

// Aqui, criamos o método responsável por atualizar uma participação em evento.
const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const participacao = await participacaoEventoService.atualizar(id, req.body);
    res.json(participacao);
});

// Aqui, criamos o método responsável por excluir uma participação em evento.
const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await participacaoEventoService.excluir(id);
    res.status(204).send();
});

// Aqui, exportamos todos os métodos do controller para serem utilizados nas rotas.
module.exports = {
    criar,
    listar,
    buscarPorId,
    listarPorJovem,
    listarPorEvento,
    atualizar,
    excluir
};
