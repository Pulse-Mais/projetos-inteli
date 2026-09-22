// src/services/saudeMentalService.js

// Aqui, importamos o repository responsável por acessar os dados de saúde mental.
const saudeMentalRepository = require('../repositories/saudeMentalRepository');
const jovemRepository = require('../repositories/jovemRepository');
const usuarioRepository = require('../repositories/usuarioRepository');

// Aqui, importamos os erros personalizados usados nas validações do service.
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class SaudeMentalService {

    // Aqui, criamos um novo atendimento de saúde mental.
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarResumo(dados.resumo);
        await this._verificarJovemExiste(dados.jovem_id);
        await this._verificarProfissionalExiste(dados.profissional_id);

        return saudeMentalRepository.criar(dados);
    }

    // Aqui, buscamos um atendimento de saúde mental pelo ID.
    async buscarPorId(id) {
        const atendimento = await saudeMentalRepository.buscarPorId(id);
        if (!atendimento) throw new NotFoundError('Atendimento de saúde mental');
        return atendimento;
    }

    // Aqui, listamos atendimentos de saúde mental com filtros opcionais.
    async listarTodos(filtros = {}) {
        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }

        if (filtros.profissional_id) {
            filtros.profissional_id = Number(filtros.profissional_id);
        }

        return saudeMentalRepository.listarTodos(filtros);
    }

    // Aqui, atualizamos um atendimento de saúde mental existente.
    async atualizar(id, dados) {
        const atendimento = await saudeMentalRepository.buscarPorId(id);
        if (!atendimento) throw new NotFoundError('Atendimento de saúde mental');

        if (dados.resumo !== undefined) {
            this._validarResumo(dados.resumo);
        }

        return saudeMentalRepository.atualizar(id, dados);
    }

    // Aqui, excluímos um atendimento de saúde mental existente.
    async excluir(id) {
        const atendimento = await saudeMentalRepository.buscarPorId(id);
        if (!atendimento) throw new NotFoundError('Atendimento de saúde mental');

        return saudeMentalRepository.excluir(id);
    }

    // Aqui, validamos se os campos obrigatórios foram enviados.
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'profissional_id', 'data_atendimento', 'resumo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);

        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, validamos se o resumo possui conteúdo útil.
    _validarResumo(resumo) {
        if (!resumo || !resumo.trim()) {
            throw new BadRequestError('O resumo do atendimento não pode ser vazio');
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    async _verificarProfissionalExiste(profissional_id) {
        const usuario = await usuarioRepository.buscarPorId(profissional_id);
        if (!usuario) throw new NotFoundError('Profissional');
    }
}

module.exports = new SaudeMentalService();
