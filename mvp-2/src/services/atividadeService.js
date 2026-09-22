// src/services/atividadeService.js

const atividadesRepository = require('../repositories/atividadesRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class AtividadeService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        return atividadesRepository.criar(dados);
    }

    async buscarPorId(id) {
        const registro = await atividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Atividade');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.programa_id) {
            filtros.programa_id = Number(filtros.programa_id);
        }

        return atividadesRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const registro = await atividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Atividade');

        return atividadesRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await atividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Atividade');
        return atividadesRepository.excluir(id);
    }

    // Método interno

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['programa_id', 'titulo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }
}

module.exports = new AtividadeService();
