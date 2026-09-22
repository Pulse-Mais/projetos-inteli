// src/controllers/saudeMentalController.js

// Aqui, importamos o service responsável pelas regras de negócio de saúde mental.
const saudeMentalService = require('../services/saudeMentalService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente.
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos.
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro usada para requisições inválidas.
const { BadRequestError } = require('../errors/AppError');

// Aqui, criamos o método responsável por cadastrar um atendimento de saúde mental.
const criar = asyncHandler(async (req, res) => {
    const atendimento = await saudeMentalService.criar(req.body);
    res.status(201).json(atendimento);
});

// Aqui, criamos o método responsável por listar atendimentos de saúde mental.
const listar = asyncHandler(async (req, res) => {
    const { jovem_id, profissional_id, data_atendimento } = req.query;
    const atendimentos = await saudeMentalService.listarTodos({
        jovem_id,
        profissional_id,
        data_atendimento
    });

    res.json(atendimentos);
});

// Aqui, criamos o método responsável por buscar um atendimento de saúde mental pelo ID.
const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const atendimento = await saudeMentalService.buscarPorId(id);
    res.json(atendimento);
});

// Aqui, criamos o método responsável por atualizar um atendimento de saúde mental.
const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const atendimento = await saudeMentalService.atualizar(id, req.body);
    res.json(atendimento);
});

// Aqui, criamos o método responsável por excluir um atendimento de saúde mental.
const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await saudeMentalService.excluir(id);
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
