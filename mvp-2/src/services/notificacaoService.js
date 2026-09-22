// src/services/notificacaoService.js

const notificacaoRepository = require('../repositories/notificacaoRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const TIPOS_VALIDOS = ['Alerta', 'Jovem', 'Evento', 'Mentoria', 'Sistema', 'Conquista'];

class NotificacaoService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarTipo(dados.tipo);
        return notificacaoRepository.criar(dados);
    }

    async buscarPorId(id) {
        const registro = await notificacaoRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Notificação');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.usuario_id !== undefined) {
            filtros.usuario_id = Number(filtros.usuario_id);
        }
        if (filtros.lida !== undefined) {
            filtros.lida = filtros.lida === 'true' || filtros.lida === true;
        }
        return notificacaoRepository.listarTodos(filtros);
    }

    async marcarComoLida(id) {
        const registro = await notificacaoRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Notificação');
        return notificacaoRepository.marcarComoLida(id);
    }

    async atualizar(id, dados) {
        const registro = await notificacaoRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Notificação');
        this._validarTipo(dados.tipo);
        return notificacaoRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await notificacaoRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Notificação');
        return notificacaoRepository.excluir(id);
    }

    async purgarAntigas() {
        return notificacaoRepository.purgarAntigas();
    }

    // Métodos internos 

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['tipo', 'titulo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarTipo(tipo) {
        if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
            throw new BadRequestError(`Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
        }
    }
}

module.exports = new NotificacaoService();