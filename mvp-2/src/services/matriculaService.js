// src/services/matriculaService.js

const matriculaRepository = require('../repositories/matriculaRepository');
const jovemRepository = require('../repositories/jovemRepository');
const programaRepository = require('../repositories/programaRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const STATUS_VALIDOS = ['Ativo', 'Concluido', 'Evadido', 'Trancado'];
const TURMAS_VALIDAS = ['Turma 1', 'Turma 2', 'Turma Remota'];

class MatriculaService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarStatus(dados.status);
        this._validarTurma(dados.turma);
        await this._verificarJovemExiste(dados.jovem_id);
        await this._verificarProgramaExiste(dados.programa_id);
        return matriculaRepository.criar(dados);
    }

    async buscarPorId(id) {
        const registro = await matriculaRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Matrícula');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.jovem_id) filtros.jovem_id = Number(filtros.jovem_id);
        if (filtros.programa_id) filtros.programa_id = Number(filtros.programa_id);
        return matriculaRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const registro = await matriculaRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Matrícula');
        this._validarStatus(dados.status);
        this._validarTurma(dados.turma);
        return matriculaRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await matriculaRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Matrícula');
        return matriculaRepository.excluir(id);
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'programa_id'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarStatus(status) {
        if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
            throw new BadRequestError(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`);
        }
    }

    _validarTurma(turma) {
        if (turma !== undefined && turma !== null && !TURMAS_VALIDAS.includes(turma)) {
            throw new BadRequestError(`Turma inválida. Use: ${TURMAS_VALIDAS.join(', ')}`);
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    async _verificarProgramaExiste(programa_id) {
        const programa = await programaRepository.buscarPorId(programa_id);
        if (!programa) throw new NotFoundError('Programa');
    }
}

module.exports = new MatriculaService();