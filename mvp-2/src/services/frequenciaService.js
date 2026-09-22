// src/services/frequenciaService.js

const frequenciaRepository = require('../repositories/frequenciaRepository');
const jovemRepository = require('../repositories/jovemRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError');

const TIPOS_PRESENCA = ['Presencial', 'Gravacao', 'Ausente'];
const TURMAS_VALIDAS = ['Turma 1', 'Turma 2', 'Turma Remota'];

class FrequenciaService {
    
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarTipoPresenca(dados.tipo_presenca);
        await this._verificarJovemExiste(dados.jovem_id);
        await this._verificarResponsavelExiste(dados.responsavel_id);
        await this._verificarDuplicata(dados.jovem_id, dados.data_aula, dados.programa_id ?? null);

        return frequenciaRepository.criar(dados);
    }

    async buscarPorId(id) {
        const frequencia = await frequenciaRepository.buscarPorId(id);
        if (!frequencia) throw new NotFoundError ('Frequência');
        return frequencia;
    }

    async listarTodos(filtros = {}) {
        if (filtros.tipo_presenca) {
            this._validarTipoPresenca(filtros.tipo_presenca);
        }

        // Converte jovem_id de string para número
        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }

        if (filtros.programa_id) {
            filtros.programa_id = Number(filtros.programa_id);
        }

        return frequenciaRepository.listarTodos(filtros);
    }

    async listarAlunosPrograma(filtros = {}) {
        if (!filtros.programa_id) {
            throw new BadRequestError('programa_id é obrigatório');
        }
        if (filtros.turma && !TURMAS_VALIDAS.includes(filtros.turma)) {
            throw new BadRequestError(`Turma inválida. Use: ${TURMAS_VALIDAS.join(', ')}`);
        }

        return frequenciaRepository.listarAlunosPrograma({
            programa_id: Number(filtros.programa_id),
            data_aula: filtros.data_aula || null,
            turma: filtros.turma || null,
        });
    }

    async atualizar(id, dados) {
        const frequencia = await frequenciaRepository.buscarPorId(id);
        if (!frequencia) throw new NotFoundError ('Frequência');

        if (dados.tipo_presenca !== undefined) {
            this._validarTipoPresenca(dados.tipo_presenca);
        }

        // Se mudar a data, verificar duplicata com o novo valor
        if (dados.data_aula !== undefined) {
            const jovem_id = frequencia.jovem_id;
            const data_aula = dados.data_aula;
            const programa_id = dados.programa_id ?? frequencia.programa_id ?? null;
            await this._verificarDuplicata(jovem_id, data_aula, programa_id, id);
        }


        return frequenciaRepository.atualizar(id, dados);
    }

    async resumoPorJovem(programa_id = null) {
        return frequenciaRepository.resumoPorJovem(programa_id || null);
    }

    async excluir(id) {
        const frequencia = await frequenciaRepository.buscarPorId(id);
        if (!frequencia) throw new NotFoundError('Frequência');
        return frequenciaRepository.excluir(id);
    }

    // Métodos internos
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'data_aula', 'tipo_presenca', 'responsavel_id'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes ${ausentes.join(', ')}`);
        }
    }

    _validarTipoPresenca(tipo) {
        if (!TIPOS_PRESENCA.includes(tipo)) {
            throw new BadRequestError(
                `tipo_presenca inválido. Valores permitidos: ${TIPOS_PRESENCA.join(', ')}`
            );
        }
    }

    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    async _verificarResponsavelExiste(responsavel_id) {
        const usuario = await usuarioRepository.buscarPorId(responsavel_id);
        if (!usuario) throw new NotFoundError('Responsável');
    }

    async _verificarDuplicata(jovem_id, data_aula, programa_id = null, excluirId = null) {
        const existente = await frequenciaRepository.buscarDuplicata(jovem_id, data_aula, programa_id, excluirId);
        if (existente) {
            throw new ConflictError('Já existe um registro de frequência para este jovem nesta data e programa');
        }
    }
}

module.exports = new FrequenciaService();