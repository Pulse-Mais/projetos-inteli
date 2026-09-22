// src/services/entregaAtividadeService.js

const entregaAtividadesRepository = require('../repositories/entregaAtividadeRepository');
const jovemRepository = require('../repositories/jovemRepository');
const atividadesRepository = require('../repositories/atividadesRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const STATUS_VALIDADOS = ['Entregue', 'Pendente', 'Atrasada'];

class EntregaAtividadeService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarStatus(dados.status);
        this._validarNota(dados.nota);
        await this._verificarJovemExiste(dados.jovem_id);
        await this._verificarAtividadeExiste(dados.atividades_id);
        return entregaAtividadesRepository.criar(dados);
    }

    async buscarPorId(id) {
        const registro = await entregaAtividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Entrega de atividades');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.atividades_id) filtros.atividades_id = Number(filtros.atividades_id);
        if (filtros.jovem_id) filtros.jovem_id = Number(filtros.jovem_id);
        return entregaAtividadesRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const registro = await entregaAtividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Entrega de atividade');
        this._validarStatus(dados.status);
        this._validarNota(dados.nota);
        return entregaAtividadesRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await entregaAtividadesRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Entrega de atividade');
        return entregaAtividadesRepository.excluir(id);
    }

    // Métodos internos

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['atividades_id', 'jovem_id'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarStatus(status) {
        if (status !== undefined && !STATUS_VALIDADOS.includes(status)) {
            throw new BadRequestError(`Status inválido. Use ${STATUS_VALIDADOS.join(', ')}`);
        }
    }

    _validarNota(nota) {
        if (nota !== undefined && nota !== null) {
            const n = Number(nota);
            if (isNaN(n) || n < 0 || n > 10) {
                throw new BadRequestError('Nota deve ser um número entre 0 e 10');
            }
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    async _verificarAtividadeExiste(atividades_id) {
        const atividade = await atividadesRepository.buscarPorId(atividades_id);
        if (!atividade) throw new NotFoundError('Atividade');
    }
}

module.exports = new EntregaAtividadeService();