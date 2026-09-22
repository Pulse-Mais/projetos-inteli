// src/services/certificadoService.js

const certificadoRepository = require('../repositories/certificadoRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

class CertificadoService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        return certificadoRepository.criar(dados);
    }

    async buscarPorId(id) {
        const certificado = await certificadoRepository.buscarPorId(id);
        if (!certificado) throw new NotFoundError('Certificado');
        return certificado;
    }

    async listarTodos(filtros = {}) {
        if (filtros.jovem_id) filtros.jovem_id = Number(filtros.jovem_id);
        return certificadoRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const certificado = await certificadoRepository.buscarPorId(id);
        if (!certificado) throw new NotFoundError('Certificado');
        return certificadoRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const certificado = await certificadoRepository.buscarPorId(id);
        if (!certificado) throw new NotFoundError('Certificado');
        return certificadoRepository.excluir(id);
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'nome'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }
}

module.exports = new CertificadoService();
