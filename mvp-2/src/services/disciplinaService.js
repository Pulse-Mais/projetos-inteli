// src/services/disciplinaService.js

const disciplinaRepository = require('../repositories/disciplinaRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const STATUS_VALIDOS = ['Aprovado', 'Reprovado', 'Em_andamento', 'Trancado'];

class DisciplinaService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarStatus(dados.status);
        return disciplinaRepository.criar(dados);
    }

    async buscarPorId(id) {
        const disciplina = await disciplinaRepository.buscarPorId(id);
        if (!disciplina) throw new NotFoundError('Disciplina');
        return disciplina;
    }

    async listarTodos(filtros = {}) {
        if (filtros.status) this._validarStatus(filtros.status);
        if (filtros.ensino_superior_id) filtros.ensino_superior_id = Number(filtros.ensino_superior_id);
        if (filtros.jovem_id)           filtros.jovem_id           = Number(filtros.jovem_id);
        return disciplinaRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const disciplina = await disciplinaRepository.buscarPorId(id);
        if (!disciplina) throw new NotFoundError('Disciplina');

        if (dados.status !== undefined) this._validarStatus(dados.status);

        return disciplinaRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const disciplina = await disciplinaRepository.buscarPorId(id);
        if (!disciplina) throw new NotFoundError('Disciplina');
        return disciplinaRepository.excluir(id);
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['ensino_superior_id', 'nome', 'status'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarStatus(status) {
        if (!STATUS_VALIDOS.includes(status)) {
            throw new BadRequestError(
                `status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}`
            );
        }
    }
}

module.exports = new DisciplinaService();
