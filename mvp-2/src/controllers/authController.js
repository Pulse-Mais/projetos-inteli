// src/controllers/authController.js

const authService = require('../services/authService');
const { asyncHandler } = require('../middlewares/asyncHandler');

class AuthController {

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const resultado = await authService.login(email, senha);
            return res.status(200).json(resultado);
        } catch (err) {
            next(err);
        }
    }

    logoutAll = asyncHandler(async (req, res) => {
        const resultado = await authService.logoutAll(req.usuario.id);
        res.json(resultado);
    });

    cadastrar = asyncHandler(async (req, res) => {
        const resultado = await authService.cadastrarAluno(req.body);
        res.status(201).json(resultado);
    });

    desativarConta = asyncHandler(async (req, res) => {
        const resultado = await authService.desativarConta(req.usuario.id);
        res.json(resultado);
    });
}

module.exports = new AuthController();
