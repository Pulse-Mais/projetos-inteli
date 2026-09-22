// src/services/JovemService.js

const jovemRepository = require('../repositories/jovemRepository');
const { isValidCpf, sanitizeCpf } = require('../helpers/cpfValidator');
const { isValidEmail } = require('../helpers/emailValidator');
const {
    BadRequestError,
    ConflictError,
    NotFoundError,
    ForbiddenError,
} = require('../errors/AppError');
const { notificarGestores } = require('../helpers/notificacaoHelper');


// ENUMs espelhados da migration - se o banco mudar, muda aqui também
const STATUS_JORNADA_VALIDOS = [
    'Conectado',
    'Capacitado',
    'Transformado',
    'Conectado_Capacitado',
    'Capacitado_Transformado',
    'Conectado_Capacitado_Transformado',
];

const TIPOS_MORADIA_VALIDOS = ['Propria', 'Alugada', 'Cedida', 'Financiada', 'Outros'];

const STATUS_EMPREGABILIDADE_VALIDOS = ['Empregado', 'Em_formacao', 'Buscando', 'Empreendedor', 'Inativo'];

class JovemService {
    async criar(dados) {
        this._validarCamposObrigatorios(dados);

        const cpf = sanitizeCpf(dados.cpf);
        if (!isValidCpf(cpf)) {
            throw new BadRequestError('CPF inválido');
        }

        if (!isValidEmail(dados.email)) {
            throw new BadRequestError('E-mail inválido');
        }

        if (!STATUS_JORNADA_VALIDOS.includes(dados.status_jornada)) {
            throw new BadRequestError(
                `status_jornada inválido. Valores permitidos: ${STATUS_JORNADA_VALIDOS.join(', ')}`
            );
        }

        if (dados.tipo_moradia != null && !TIPOS_MORADIA_VALIDOS.includes(dados.tipo_moradia)) {
            throw new BadRequestError(
                `tipo_moradia inválido. Valores permitidos: ${TIPOS_MORADIA_VALIDOS.join(', ')}`
            );
        }

        if (dados.status_empregabilidade != null && !STATUS_EMPREGABILIDADE_VALIDOS.includes(dados.status_empregabilidade)) {
            throw new BadRequestError(
                `status_empregabilidade inválido. Valores permitidos: ${STATUS_EMPREGABILIDADE_VALIDOS.join(', ')}`
            );
        }

        await this._verificarCpfUnico(cpf);
        await this._verificarEmailUnico(dados.email);

        const jovem = await jovemRepository.criar({ ...dados, cpf });
        notificarGestores('Jovem', `Novo jovem cadastrado: ${jovem.nome}`, { link: `/jovens/${jovem.id}` }).catch(() => {});
        return jovem;
    }

    async buscarPorId(id, usuario) {
        if (usuario?.perfil === 'Aluno' && usuario.jovem_id !== id) {
            throw new ForbiddenError('Acesso negado');
        }
        const jovem = await jovemRepository.buscarPorId(id);
        if (!jovem) throw new NotFoundError('Jovem');
        return jovem;
    }

    async listarTodos(filtros = {}) {
        if (filtros.status_jornada && !STATUS_JORNADA_VALIDOS.includes(filtros.status_jornada)) {
            throw new BadRequestError(
                `status_jornada inválido. Valores permitidos: ${STATUS_JORNADA_VALIDOS.join(', ')}`
            );
        }

        if (filtros.status_empregabilidade && !STATUS_EMPREGABILIDADE_VALIDOS.includes(filtros.status_empregabilidade)) {
            throw new BadRequestError(
                `status_empregabilidade inválido. Valores permitidos: ${STATUS_EMPREGABILIDADE_VALIDOS.join(', ')}`
            );
        }

        // Query sting chega como string - converte para boolean antes de passar ao repo
        if (filtros.ativo !== undefined) {
            filtros.ativo = filtros.ativo === 'true' || filtros.ativo === true;
        }

        return jovemRepository.listarTodos(filtros);
    }

    async atualizar(id, dados) {
        const jovem = await jovemRepository.buscarPorId(id);
        if (!jovem) throw new NotFoundError('Jovem');

        if (dados.cpf !== undefined) {
            const cpf = sanitizeCpf(dados.cpf);
            if (!isValidCpf(cpf)) throw new BadRequestError('CPF inválido');
            await this._verificarCpfUnico(cpf, id); // Passa id para excluir o próprio registro
            dados.cpf = cpf;
        }

        if (dados.email !== undefined) {
            if (!isValidEmail(dados.email)) throw new BadRequestError('E-mail inválido');
            await this._verificarEmailUnico(dados.email, id);
        }

        if (dados.status_jornada !== undefined && !STATUS_JORNADA_VALIDOS.includes(dados.status_jornada)) {
            throw new BadRequestError(
                `status_jornada inválido. Valores permitidos: ${STATUS_JORNADA_VALIDOS.join(', ')}`
            );
        }

        if (dados.tipo_moradia != null && !TIPOS_MORADIA_VALIDOS.includes(dados.tipo_moradia)) {
            throw new BadRequestError(
                `tipo_moradia inválido. Valores permitidos: ${TIPOS_MORADIA_VALIDOS.join(', ')}`
            );
        }

        if (dados.status_empregabilidade != null && !STATUS_EMPREGABILIDADE_VALIDOS.includes(dados.status_empregabilidade)) {
            throw new BadRequestError(
                `status_empregabilidade inválido. Valores permitidos: ${STATUS_EMPREGABILIDADE_VALIDOS.join(', ')}`
            );
        }

        return jovemRepository.atualizar(id, dados);
    }

    async arquivar(id) {
        const jovem = await jovemRepository.buscarPorId(id);
        if (!jovem) throw new NotFoundError('Jovem');
        return jovemRepository.arquivar(id);
    }

    // Métodos Internos

    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['nome', 'data_nascimento', 'email', 'cpf', 'status_jornada'];
        const ausentes = obrigatorios.filter(campo => !dados[campo]);
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    async _verificarCpfUnico(cpf, excluirId = null) {
        const existente = await jovemRepository.buscarPorCpf(cpf, excluirId);
        if (existente) throw new ConflictError('CPF já cadastrado');
    }

    async _verificarEmailUnico(email, excluirId = null) {
        const existente = await jovemRepository.buscarPorEmail(email, excluirId);
        if (existente) throw new ConflictError('E-mail já cadastrado');
    }

    async buscarFicha(id) {
        const ficha = await jovemRepository.buscarFicha(id);
        if (!ficha) throw new NotFoundError('Jovem');
        return ficha;
    }

}

module.exports = new JovemService();