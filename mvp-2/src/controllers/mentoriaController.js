// src/controllers/mentoriaController.js

// Aqui, importamos o service responsável pelas regras de negócio de mentoria
const mentoriaService = require('../services/mentoriaService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro para requisições inválidas
const { BadRequestError } = require('../errors/AppError');


// Aqui, criamos o método responsável por cadastrar uma nova mentoria
const criar = asyncHandler(async (req, res) => {

    // Aqui, recebemos os dados enviados no corpo da requisição
    const dados = req.body;

    // Aqui, enviamos os dados para o service realizar a criação da mentoria
    const mentoria = await mentoriaService.criar(dados);

    // Aqui, retornamos a mentoria criada com status HTTP 201
    res.status(201).json(mentoria);
});


// Aqui, criamos o método responsável por listar mentorias
const listar = asyncHandler(async (req, res) => {

    // Aqui, extraímos os filtros enviados pela query da requisição
    const { mentor_id, status_mentoria, data_mentoria, jovem_id } = req.query;

    // Aqui, enviamos os filtros para o service buscar as mentorias correspondentes
    const mentorias = await mentoriaService.listarTodos({ mentor_id, status_mentoria, data_mentoria, jovem_id });

    // Aqui, retornamos a lista de mentorias encontradas
    res.json(mentorias);
});


// Aqui, criamos o método responsável por buscar uma mentoria pelo ID
const buscarPorId = asyncHandler(async (req, res) => {

    // Aqui, convertemos e validamos o ID recebido pela URL
    const id = parsePositiveInt(req.params.id);

    // Aqui, verificamos se o ID informado é inválido
    if (!id) {

        // Aqui, lançamos um erro personalizado caso o ID seja inválido
        throw new BadRequestError('ID inválido');
    }

    // Aqui, buscamos a mentoria correspondente ao ID informado
    const mentoria = await mentoriaService.buscarPorId(id);

    // Aqui, retornamos a mentoria encontrada
    res.json(mentoria);
});


// Aqui, criamos o método responsável por atualizar uma mentoria
const atualizar = asyncHandler(async (req, res) => {

    // Aqui, convertemos e validamos o ID recebido pela URL
    const id = parsePositiveInt(req.params.id);

    // Aqui, verificamos se o ID informado é inválido
    if (!id) {

        // Aqui, lançamos um erro personalizado caso o ID seja inválido
        throw new BadRequestError('ID inválido');
    }

    // Aqui, enviamos os novos dados para o service atualizar a mentoria
    const mentoria = await mentoriaService.atualizar(id, req.body);

    // Aqui, retornamos a mentoria atualizada
    res.json(mentoria);
});


// Aqui, criamos o método responsável por excluir uma mentoria
const excluir = asyncHandler(async (req, res) => {

    // Aqui, convertemos e validamos o ID recebido pela URL
    const id = parsePositiveInt(req.params.id);

    // Aqui, verificamos se o ID informado é inválido
    if (!id) {

        // Aqui, lançamos um erro personalizado caso o ID seja inválido
        throw new BadRequestError('ID inválido');
    }

    // Aqui, solicitamos ao service a exclusão da mentoria
    await mentoriaService.excluir(id);

    // Aqui, retornamos o status HTTP 204 indicando exclusão sem conteúdo
    res.status(204).send();
});


// Aqui, exportamos todos os métodos do controller para serem utilizados nas rotas
module.exports = {
    criar,
    listar,
    buscarPorId,
    atualizar,
    excluir
};