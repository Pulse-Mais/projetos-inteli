// src/services/logAuditoriaService.js

const logAuditoriaRepository = require('../repositories/logAuditoriaRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const OPERACOES_VALIDAS = ['INSERT', 'UPDATE', 'DELETE', 'ACESSO_NEGADO'];

class LogAuditoriaService {
    
    async buscarPorId(id) {
        const registro = await logAuditoriaRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Log de Auditoria');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.operacao) {
            this._validarOperacao(filtros.operacao);
        }

        if (filtros.usuario_id) {
            filtros.usuario_id = Number(filtros.usuario_id);
        }

        return logAuditoriaRepository.listarTodos(filtros);
    }

    // Métodos interno

    _validarOperacao(valor) {
        if (!OPERACOES_VALIDAS.includes(valor)) {
            throw new BadRequestError(
                `operacao inválida. Valores permitidos: ${OPERACOES_VALIDAS.join(', ')}`
            );
        }
    }
}

module.exports = new LogAuditoriaService();