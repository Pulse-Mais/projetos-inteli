// src/services/competenciaService.js

const competenciaRepository = require('../repositories/competenciaRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const TIPOS_VALIDOS  = ['Competencia', 'Curso', 'Evento', 'Certificacao'];
const NIVEIS_VALIDOS = ['Basico', 'Intermediario', 'Avancado'];

class CompetenciaService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarTipo(dados.tipo);

        if (dados.nivel !== undefined) {
            this._validarNivel(dados.nivel);
        }

        return competenciaRepository.criar(dados);
    }

    async buscarPorId(id) {
        const competencia = await competenciaRepository.buscarPorId(id);
        if (!competencia) throw new NotFoundError('Competencia');
        return competencia;
    }

    async listarTodos(filtros = {}) {
        if (filtros.tipo) this._validarTipo(filtros.tipo);
        if (filtros.nivel) this._validarNivel(filtros.nivel);
        if (filtros.jovem_id) filtros.jovem_id = Number(filtros.jovem_id);
        return competenciaRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const competencia = await competenciaRepository.buscarPorId(id);
        if (!competencia) throw new NotFoundError('Competencia');

        if (dados.tipo !== undefined) this._validarTipo(dados.tipo);
        if (dados.nivel !== undefined) this._validarNivel(dados.nivel);

        return competenciaRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const competencia = await competenciaRepository.buscarPorId(id);
        if (!competencia) throw new NotFoundError('Competencia');
        return competenciaRepository.excluir(id);
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'nome', 'tipo'];
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

    _validarNivel(nivel) {
        if (!NIVEIS_VALIDOS.includes(nivel)) {
            throw new BadRequestError(
                `nível inválido. Valores permitidos: ${NIVEIS_VALIDOS.join(', ')}`
            );
        }
    }
}

module.exports = new CompetenciaService();