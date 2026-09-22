// src/services/oportunidadeService.js

const oportunidadeRepository = require('../repositories/oportunidadeRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const TIPOS_VALIDOS      = ['Curso', 'Evento', 'Bolsa'];
const MODALIDADES_VALIDAS = ['Online', 'Presencial', 'Hibrido'];

class OportunidadeService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarTipo(dados.tipo);

        if (dados.modalidade !== undefined) {
            this._validarModalidade(dados.modalidade);
        }

        return oportunidadeRepository.criar(dados);
    }

    async buscarPorId(id) {
        const oportunidade = await oportunidadeRepository.buscarPorId(id);
        if (!oportunidade) throw new NotFoundError('Oportunidade');
        return oportunidade;
    }

    async listarTodos(filtros = {}) {
        if (filtros.tipo) this._validarTipo(filtros.tipo);
        if (filtros.modalidade) this._validarModalidade(filtros.modalidade);

        if (filtros.ativo !== undefined) {
            filtros.ativo = filtros.ativo === 'true' || filtros.ativo === true;
        }

        return oportunidadeRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const oportunidade = await oportunidadeRepository.buscarPorId(id);
        if (!oportunidade) throw new NotFoundError('Oportunidade');

        if (dados.tipo !== undefined) this._validarTipo(dados.tipo);
        if (dados.modalidade !== undefined) this._validarModalidade(dados.modalidade);

        return oportunidadeRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const oportunidade = await oportunidadeRepository.buscarPorId(id);
        if (!oportunidade) throw new NotFoundError('Oportunidade');
        return oportunidadeRepository.excluir(id);
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['tipo', 'titulo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarTipo(tipo) {
        if (!TIPOS_VALIDOS.includes(tipo)) {
            throw new BadRequestError(
                `tipo inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`
            );
        }
    }
    
    _validarModalidade(modalidade) {
        if (!MODALIDADES_VALIDAS.includes(modalidade)) {
            throw new BadRequestError(
                `modalidade inválida. Valores permitidos: ${MODALIDADES_VALIDAS.join(', ')}`
            );
        }
    }
}

module.exports = new OportunidadeService();