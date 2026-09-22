// src/controllers/usuarioController.js

// Aqui, importamos o service responsável pelas regras de negócio de usuários.
const usuarioService = require('../services/usuarioService');

// Aqui, importamos o middleware que trata erros assíncronos automaticamente.
const { asyncHandler } = require('../middlewares/asyncHandler');

// Aqui, importamos a função que converte e valida IDs positivos.
const { parsePositiveInt } = require('../helpers/parseId');

// Aqui, importamos a classe de erro usada para requisições inválidas.
const { BadRequestError } = require('../errors/AppError');

// Aqui, criamos o método responsável por cadastrar um novo usuário.
const criar = asyncHandler(async (req, res) => {
    const usuario = await usuarioService.criar(req.body);
    res.status(201).json(usuario);
});

// Aqui, criamos o método responsável por listar usuários.
const listar = asyncHandler(async (req, res) => {
    const { perfil, ativo, busca } = req.query;
    const usuarios = await usuarioService.listarTodos({ perfil, ativo, busca });
    res.json(usuarios);
});

// Aqui, criamos o método responsável por buscar um usuário pelo ID.
const buscarPorId = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const usuario = await usuarioService.buscarPorId(id);
    res.json(usuario);
});

// Aqui, criamos o método responsável por atualizar um usuário.
const atualizar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const usuario = await usuarioService.atualizar(id, req.body);
    res.json(usuario);
});

// Aqui, criamos o método responsável por desativar um usuário.
const desativar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const usuario = await usuarioService.desativar(id);
    res.json(usuario);
});

// Aqui, criamos o método responsável por reativar um usuário.
const reativar = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    const usuario = await usuarioService.reativar(id);
    res.json(usuario);
});

// Aqui, criamos o método responsável por excluir um usuário.
const excluir = asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) throw new BadRequestError('ID inválido');

    await usuarioService.excluir(id);
    res.status(204).send();
});

// Aqui, exportamos todos os métodos do controller para serem utilizados nas rotas.
module.exports = {
    criar,
    listar,
    buscarPorId,
    atualizar,
    desativar,
    reativar,
    excluir
};
