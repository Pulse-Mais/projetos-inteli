// src/services/mentoriaService.js

// Aqui, importamos o repository responsável por acessar os dados de mentoria no banco
const mentoriaRepository = require('../repositories/mentoriaRepository');

// Aqui, importamos o repository de usuários para validar o mentor informado
const usuarioRepository = require('../repositories/usuarioRepository');

// Aqui, importamos os erros personalizados usados nas validações do service
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const { gerarNotificacao } = require('../helpers/notificacaoHelper');

// Aqui, definimos os status permitidos para uma mentoria
const STATUS_MENTORIA = ['Agendada', 'Realizada', 'Cancelada'];

class MentoriaService {

    // Aqui, criamos uma nova mentoria
    async criar(dados) {
        // Aqui, validamos se os campos obrigatórios foram enviados
        this._validarCamposObrigatorios(dados);

        // Aqui, validamos se o status da mentoria é permitido
        this._validarStatusMentoria(dados.status_mentoria);

        // Aqui, validamos se duracao_minutos é um inteiro positivo
        this._validarDuracaoMinutos(dados.duracao_minutos);

        // Aqui, validamos se o mentor existe e possui o perfil correto
        await this._validarMentor(dados.mentor_id);

        // Aqui, validamos se jovem_ids é um array não-vazio
        this._validarJovemIds(dados.jovem_ids);


        // Aqui, enviamos os dados validados para o repository criar a mentoria
        const mentoria = await mentoriaRepository.criar(dados);
        const dataFormatada = new Date(dados.data_mentoria).toLocaleDateString('pt-BR');
        gerarNotificacao('Mentoria', `Mentoria agendada para ${dataFormatada}`, dados.mentor_id);
        return mentoria;
    }

    // Aqui, buscamos uma mentoria pelo ID
    async buscarPorId(id) {
        // Aqui, consultamos a mentoria no banco pelo ID informado
        const mentoria = await mentoriaRepository.buscarPorId(id);

        // Aqui, verificamos se a mentoria não foi encontrada
        if (!mentoria) throw new NotFoundError('Mentoria');

        // Aqui, retornamos a mentoria encontrada
        return mentoria;
    }

    // Aqui, listamos todas as mentorias, podendo usar filtros
    async listarTodos(filtros = {}) {
        // Aqui, validamos o status caso ele tenha sido enviado como filtro
        if (filtros.status_mentoria) {
            this._validarStatusMentoria(filtros.status_mentoria);
        }

        // Aqui, convertemos mentor_id de string para número, caso ele tenha sido enviado
        if (filtros.mentor_id) {
            filtros.mentor_id = Number(filtros.mentor_id);
        }

        // Aqui, convertemos jovem_id de string para número, caso ele tenha sido enviado
        if (filtros.jovem_id) {
            filtros.jovem_id = Number(filtros.jovem_id);
        }


        // Aqui, enviamos os filtros para o repository listar as mentorias
        return mentoriaRepository.listarTodos(filtros);
    }

    // Aqui, atualizamos uma mentoria existente
    async atualizar(id, dados) {
        // Aqui, buscamos a mentoria antes de atualizar para verificar se ela existe
        const mentoria = await mentoriaRepository.buscarPorId(id);

        // Aqui, lançamos erro caso a mentoria não exista
        if (!mentoria) throw new NotFoundError('Mentoria');

        // Aqui, validamos o status da mentoria caso ele tenha sido enviado na atualização
        if (dados.status_mentoria !== undefined) {
            this._validarStatusMentoria(dados.status_mentoria);
        }

        // Aqui, validamos duracao_minutos caso ele tenha sido enviado na atualização
        if (dados.duracao_minutos !== undefined) {
            this._validarDuracaoMinutos(dados.duracao_minutos);
        }

        // Aqui, validamos o mentor caso mentor_id tenha sido enviado na atualização
        if (dados.mentor_id !== undefined) {
            await this._validarMentor(dados.mentor_id);
        }

        // Aqui, validamos jovem_ids quando ele foi enviado na atualização
        if (dados.jovem_ids !== undefined) {
            this._validarJovemIds(dados.jovem_ids);
        }


        // Aqui, enviamos os dados para o repository atualizar a mentoria
        return mentoriaRepository.atualizar(id, dados);
    }

    // Aqui, excluímos uma mentoria pelo ID
    async excluir(id) {
        // Aqui, buscamos a mentoria antes de excluir para verificar se ela existe
        const mentoria = await mentoriaRepository.buscarPorId(id);

        // Aqui, lançamos erro caso a mentoria não exista
        if (!mentoria) throw new NotFoundError('Mentoria');

        // Aqui, solicitamos ao repository a exclusão da mentoria
        return mentoriaRepository.excluir(id);
    }

    // Aqui, criamos um método interno para validar campos obrigatórios
    _validarCamposObrigatorios(dados) {
        // Aqui, definimos quais campos são obrigatórios para criar uma mentoria
        const obrigatorios = [
            'mentor_id',
            'status_mentoria',
            'data_mentoria',
            'duracao_minutos',
            'jovem_ids'
        ];


        // Aqui, verificamos quais campos obrigatórios não foram enviados
        const ausentes = obrigatorios.filter(c => dados[c] === undefined || dados[c] === null || dados[c] === '');

        // Aqui, lançamos erro caso exista algum campo obrigatório ausente
        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, criamos um método interno para validar o status da mentoria
    _validarStatusMentoria(status) {
        // Aqui, verificamos se o status informado está dentro dos valores permitidos
        if (!STATUS_MENTORIA.includes(status)) {
            throw new BadRequestError(
                `status_mentoria inválido. Valores permitidos: ${STATUS_MENTORIA.join(', ')}`
            );
        }
    }

    // Aqui, criamos um método interno para validar que duracao_minutos é um inteiro positivo
    _validarDuracaoMinutos(duracao) {
        // Aqui, verificamos se o valor é um número inteiro e positivo
        if (!Number.isInteger(duracao) || duracao <= 0) {
            throw new BadRequestError('duracao_minutos deve ser um número inteiro positivo');
        }
    }

    // Aqui, criamos um método interno assíncrono para validar o mentor pelo ID
    async _validarMentor(mentor_id) {
        // Aqui, buscamos o usuário pelo ID informado
        const usuario = await usuarioRepository.buscarPorId(mentor_id);

        // Aqui, lançamos erro caso o usuário não exista
        if (!usuario) {
            throw new BadRequestError(`mentor_id ${mentor_id} não encontrado`);
        }

        // Aqui, verificamos se o usuário possui o perfil de Mentor
        if (usuario.perfil !== 'Mentor') {
            throw new BadRequestError(
                `Usuário ${mentor_id} não possui perfil 'Mentor' (perfil atual: ${usuario.perfil})`
            );
        }
    }

    // Aqui, validamos se jovem_ids é um array com pelo menos um elemento
    _validarJovemIds(jovem_ids) {
        if (!Array.isArray(jovem_ids) || jovem_ids.length === 0) {
            throw new BadRequestError('jovem_ids deve ser um array com pelo menos um jovem');
        }
    }
}

module.exports = new MentoriaService();
