// src/services/participacaoEventoService.js

// Aqui, importamos o repository responsável por acessar as participações em eventos.
const participacaoEventoRepository = require('../repositories/participacaoEventoRepository');

// Aqui, importamos os repositories usados para validar se jovem e evento existem.
const jovemRepository = require('../repositories/jovemRepository');
const eventoRepository = require('../repositories/eventoRepository');

// Aqui, importamos os erros personalizados usados nas validações do service.
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError');

// Aqui, criamos a classe responsável pelas regras de negócio de participação em eventos.
class ParticipacaoEventoService {

    // Aqui, criamos uma nova participação de jovem em evento aplicando validações antes da persistência.
    async criar(dados) {

        // Aqui, validamos os campos obrigatórios para criar o vínculo jovem-evento.
        this._validarCamposObrigatorios(dados);

        // Aqui, normalizamos os IDs recebidos para números inteiros positivos.
        const jovem_id = this._validarId(dados.jovem_id, 'jovem_id');
        const evento_id = this._validarId(dados.evento_id, 'evento_id');

        // Aqui, validamos o campo de presença quando ele é enviado.
        const presente = this._normalizarBooleano(dados.presente, 'presente');

        // Aqui, garantimos que o jovem e o evento existem antes de criar a participação.
        await this._verificarJovemExiste(jovem_id);
        await this._verificarEventoExiste(evento_id);

        // Aqui, evitamos duplicidade antes de depender apenas da constraint do banco.
        await this._verificarDuplicata(jovem_id, evento_id);

        // Aqui, enviamos ao repository os dados já normalizados.
        return participacaoEventoRepository.criar({
            ...dados,
            jovem_id,
            evento_id,
            presente
        });
    }

    // Aqui, buscamos uma participação pelo ID.
    async buscarPorId(id) {

        // Aqui, validamos o ID recebido antes de consultar o banco.
        const participacaoId = this._validarId(id, 'id');

        // Aqui, buscamos a participação e retornamos erro quando ela não existe.
        const participacao = await participacaoEventoRepository.buscarPorId(participacaoId);
        if (!participacao) throw new NotFoundError('Participação em evento');

        return participacao;
    }

    // Aqui, listamos participações com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, normalizamos os filtros numéricos quando eles são enviados.
        if (filtros.jovem_id) {
            filtros.jovem_id = this._validarId(filtros.jovem_id, 'jovem_id');
        }

        if (filtros.evento_id) {
            filtros.evento_id = this._validarId(filtros.evento_id, 'evento_id');
        }

        // Aqui, normalizamos o filtro booleano de presença quando ele é enviado.
        if (filtros.presente !== undefined) {
            filtros.presente = this._normalizarBooleano(filtros.presente, 'presente');
        }

        return participacaoEventoRepository.listarTodos(filtros);
    }

    // Aqui, listamos o histórico de eventos de um jovem.
    async listarPorJovem(jovem_id) {

        // Aqui, validamos o ID do jovem e garantimos que ele existe.
        const jovemId = this._validarId(jovem_id, 'jovem_id');
        await this._verificarJovemExiste(jovemId);

        return participacaoEventoRepository.listarPorJovem(jovemId);
    }

    // Aqui, listamos os participantes de um evento.
    async listarPorEvento(evento_id) {

        // Aqui, validamos o ID do evento e garantimos que ele existe.
        const eventoId = this._validarId(evento_id, 'evento_id');
        await this._verificarEventoExiste(eventoId);

        return participacaoEventoRepository.listarPorEvento(eventoId);
    }

    // Aqui, atualizamos uma participação existente.
    async atualizar(id, dados) {

        // Aqui, validamos o ID da participação antes de consultar o banco.
        const participacaoId = this._validarId(id, 'id');

        // Aqui, garantimos que a participação existe antes de atualizar.
        const participacao = await participacaoEventoRepository.buscarPorId(participacaoId);
        if (!participacao) throw new NotFoundError('Participação em evento');

        // Aqui, permitimos atualizar apenas o status de presença.
        if (dados.presente !== undefined) {
            dados.presente = this._normalizarBooleano(dados.presente, 'presente');
        }

        const atualizada = await participacaoEventoRepository.atualizar(participacaoId, dados);
        if (!atualizada) throw new BadRequestError('Nenhum campo válido enviado para atualização');

        return atualizada;
    }

    // Aqui, excluímos uma participação existente quando a remoção física for necessária.
    async excluir(id) {

        // Aqui, validamos o ID e garantimos que a participação existe.
        const participacaoId = this._validarId(id, 'id');
        const participacao = await participacaoEventoRepository.buscarPorId(participacaoId);
        if (!participacao) throw new NotFoundError('Participação em evento');

        return participacaoEventoRepository.excluir(participacaoId);
    }

    // Métodos internos

    // Aqui, validamos se os campos obrigatórios foram enviados.
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['jovem_id', 'evento_id'];
        const ausentes = obrigatorios.filter(c => dados[c] === undefined || dados[c] === null || dados[c] === '');

        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, validamos se um ID pode ser usado como inteiro positivo.
    _validarId(valor, campo) {
        const numero = Number(valor);

        if (!Number.isInteger(numero) || numero <= 0) {
            throw new BadRequestError(`${campo} inválido`);
        }

        return numero;
    }

    // Aqui, normalizamos valores booleanos vindos do body ou da query string.
    _normalizarBooleano(valor, campo) {
        if (valor === undefined) return undefined;
        if (valor === true || valor === 'true') return true;
        if (valor === false || valor === 'false') return false;

        throw new BadRequestError(`${campo} deve ser booleano`);
    }

    // Aqui, verificamos se o jovem informado existe.
    async _verificarJovemExiste(jovem_id) {
        const jovem = await jovemRepository.buscarPorId(jovem_id);
        if (!jovem) throw new NotFoundError('Jovem');
    }

    // Aqui, verificamos se o evento informado existe.
    async _verificarEventoExiste(evento_id) {
        const evento = await eventoRepository.buscarPorId(evento_id);
        if (!evento) throw new NotFoundError('Evento');
    }

    // Aqui, verificamos se já existe uma participação para o mesmo jovem no mesmo evento.
    async _verificarDuplicata(jovem_id, evento_id) {
        const existente = await participacaoEventoRepository.buscarPorJovemEEvento(jovem_id, evento_id);

        if (existente) {
            throw new ConflictError('Este jovem já possui participação registrada neste evento');
        }
    }
}

// Aqui, exportamos uma instância única do service de participação em eventos.
module.exports = new ParticipacaoEventoService();
