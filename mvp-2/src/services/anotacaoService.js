// src/services/anotacaoService.js

const anotacaoRepository = require('../repositories/anotacaoRepository');
const jovemRepository = require('../repositories/jovemRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const CATEGORIAS_VALIDAS = ['Mentoria', 'Atendimento', 'Evolucao_Geral', 'Academico', 'Outro'];
const TIPOS_ALERTA_VALIDOS = ['Alerta', 'Conquista', 'Geral'];

class AnotacaoService {

    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarCategoria(dados.categoria);

        if (dados.tipo_alerta !== undefined) {
            this._validarTipoAlerta(dados.tipo_alerta);
        }

        await this._verificarJovemExiste(dados.jovem_id);
        await this._verificarAutorExiste(dados.autor_id);

        return anotacaoRepository.criar(dados);
    }

    async buscarPorId(id) {
        const anotacao = await anotacaoRepository.buscarPorId(id);
        if (!anotacao) throw new NotFoundError('Anotação');
        return anotacao;
    }

    async listarTodos(filtros = {}) {
        if (filtros.categoria) {
            this._validarCategoria(filtros.categoria);
        }

        if (filtros.tipo_alerta) {
            this._validarTipoAlerta(filtros.tipo_alerta);
        }

        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }

        return anotacaoRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const anotacao = await anotacaoRepository.buscarPorId(id);
        if (!anotacao) throw new NotFoundError('Anotação');

        if (dados.categoria !== undefined) {
            this._validarCategoria(dados.categoria);
        }

        if (dados.tipo_alerta !== undefined) {
            this._validarTipoAlerta(dados.tipo_alerta);
        }

        // Texto mão pode ser vazio ou so espaços
        if (dados.texto !== undefined && !dados.texto.trim()) {
            throw new BadRequestError('O texto da anotação não pode ser vazio');
        }

        return anotacaoRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const anotacao = await anotacaoRepository.buscarPorId(id);
        if (!anotacao) throw new NotFoundError('Anotação');
        return anotacaoRepository.excluir(id);
    }

    // Métodos Internos
    _validarCategoria(categoria) {
        if (!CATEGORIAS_VALIDAS.includes(categoria)) {
            throw new BadRequestError(
                `categoria inválida. Valores permitidos: ${CATEGORIAS_VALIDAS.join(', ')}`
            );
        }
    }

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'categoria', 'texto', 'autor_id'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }

        if (!dados.texto.trim()) {
            throw new BadRequestError('O texto da anotação não pode ser vazio');
        }
    }

    _validarTipoAlerta(tipo) {
        if (!TIPOS_ALERTA_VALIDOS.includes(tipo)) {
            throw new BadRequestError(
                `tipo_alerta inválido. Valores permitidos: ${TIPOS_ALERTA_VALIDOS.join(', ')}`
            );
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    async _verificarAutorExiste(autor_id) {
        const usuario = await usuarioRepository.buscarPorId(autor_id);
        if (!usuario) throw new NotFoundError('Autor');
    }
}

module.exports = new AnotacaoService();