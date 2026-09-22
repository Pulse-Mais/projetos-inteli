// src/services/ensinoSuperiorService.js

const ensinoSuperiorRepository = require('../repositories/ensinoSuperiorRepository');
const jovemRepository = require('../repositories/jovemRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const STATUS_VALIDOS = ['Cursando', 'Trancado', 'Concluido', 'Desistente'];

const MODALIDADE_BOLSA = [
    'Integral', 'Parcial', 'ProUni',
    'FIES', 'Institucional', 'Sem_bolsa', 'Outra'
];

class EnsinoSuperiorService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarEnums(dados);
        await this._verificarJovemExiste(dados.jovem_id);
        return ensinoSuperiorRepository.criar(dados);
    }

    async buscarPorId(id) {
        const registro = await ensinoSuperiorRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Ensino Superior');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.status) {
            this._validarStatus(filtros.status);
        }

        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }

        return ensinoSuperiorRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const registro = await ensinoSuperiorRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Ensino Superior');

        this._validarEnums(dados);

        return ensinoSuperiorRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await ensinoSuperiorRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Ensino Superior');
        return ensinoSuperiorRepository.excluir(id);
    }

    // Métodos internos
    
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'instituicao', 'cursos', 'status'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarEnums(dados) {
        if (dados.status !== undefined && dados.status !== null) {
            this._validarStatus(dados.status);
        }
        if (dados.modalidade_bolsa !== undefined && dados.modalidade_bolsa !== null) {
            this._validarModalidadeBolsa(dados.modalidade_bolsa);
        }
    }

    _validarStatus(valor) {
        if (!STATUS_VALIDOS.includes(valor)) {
            throw new BadRequestError(
                `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}`
            );
        }
    }

    _validarModalidadeBolsa(valor) {
        if (!MODALIDADE_BOLSA.includes(valor)) {
            throw new BadRequestError(
                `modalidade_bolsa inválida. Valores permitidos: ${MODALIDADE_BOLSA.join(', ')}`
            );
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }
}

module.exports = new EnsinoSuperiorService();