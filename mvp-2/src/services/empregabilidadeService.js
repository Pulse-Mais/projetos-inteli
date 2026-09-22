// src/services/empregabilidadeService.js

const empregabilidadeRepository = require('../repositories/empregabilidadeRepository');
const { BadRequestError, NotFoundError } = require('../errors/AppError');
const { notificarGestores } = require('../helpers/notificacaoHelper');
const { pool } = require('../database/db');

const FAIXAS_SALARIAIS = [
    'Ate_1_SM', '1_a_2_SM', '2_a_3_SM',
    '3_a_5_SM', 'Acima_5_SM', 'Nao_informado'
];

const TIPOS_VINCULOS = [
    'CLT', 'Estagio', 'PJ', 'Freelancer',
    'Informal', 'Jovem_Aprendiz', 'Outro'
];

const MODALIDADES_VALIDAS = ['Presencial', 'Remoto', 'Hibrido'];

class EmpregabilidadeService {
    
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarEnums(dados);
        const registro = await empregabilidadeRepository.criar(dados);

        try {
            const { rows } = await pool.query(`SELECT nome FROM jovens WHERE id = $1`, [dados.jovem_id]);
            const nome = rows[0]?.nome;
            if (nome) {
                const cargo = dados.cargo ? ` como ${dados.cargo}` : '';
                notificarGestores('Conquista', `${nome} empregado(a)!`, {
                    descricao: `${nome} foi contratado(a)${cargo} na ${dados.empresa}. Parabéns!`,
                    link: `/jovens/${dados.jovem_id}`,
                }).catch(() => {});
            }
        } catch { /* notificação não-crítica */ }

        return registro;
    }

    async buscarPorId(id) {
        const registro = await empregabilidadeRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Empregabilidade');
        return registro;
    }

    async listarTodos(filtros = {}) {
        if (filtros.tipo_vinculo) {
            this._validarTipoVinculo(filtros.tipo_vinculo);
        }

        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }

        if (filtros.ativo !== undefined) {
            filtros.ativo = filtros.ativo === 'true' || filtros.ativo === true;
        }

        return empregabilidadeRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const registro = await empregabilidadeRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Empregabilidade');

        this._validarEnums(dados);

        return empregabilidadeRepository.atualizar(id, dados);
    }

    async excluir(id) {
        const registro = await empregabilidadeRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Empregabilidade');
        return empregabilidadeRepository.excluir(id);
    }

    async arquivar(id) {
        const registro = await empregabilidadeRepository.buscarPorId(id);
        if (!registro) throw new NotFoundError('Empregabilidade');
        return empregabilidadeRepository.arquivar(id);
    }

    // Métodos internos

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'empresa'];
        const ausentes = obrigatorios.filter(c => !dados[c]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    _validarEnums(dados) {
        if (dados.faixa_salarial !== undefined && dados.faixa_salarial !== null) {
            this._validarFaixaSalarial(dados.faixa_salarial);
        }
        if (dados.tipo_vinculo !== undefined && dados.tipo_vinculo !== null) {
            this._validarTipoVinculo(dados.tipo_vinculo);
        }

        if (dados.modalidade !== undefined && dados.modalidade !== null) {
            this._validarModalidade(dados.modalidade);
        }
    }

    _validarFaixaSalarial(valor) {
        if (!FAIXAS_SALARIAIS.includes(valor)) {
            throw new BadRequestError(
                `faixa_salarial inválida. Valores permitidos: ${FAIXAS_SALARIAIS.join(', ')}`
            );
        }
    }

    _validarTipoVinculo(valor) {
        if (!TIPOS_VINCULOS.includes(valor)) {
            throw new BadRequestError(
                `tipo_vinculo inválido. Valores permitidos: ${TIPOS_VINCULOS.join(', ')}`
            );
        }
    }

    _validarModalidade(valor) {
        if (!MODALIDADES_VALIDAS.includes(valor)) {
            throw new BadRequestError(
                `modalidade inválida. Valores permitidos: ${MODALIDADES_VALIDAS.join(', ')}`
            );
        }
    }
}

module.exports = new EmpregabilidadeService();