// src/services/eventoService.js

// Aqui, importamos o repository responsável por acessar os dados de eventos.
const eventoRepository = require('../repositories/eventoRepository');

// Aqui, importamos os erros personalizados usados nas validações do service.
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos os tipos permitidos para eventos institucionais.
const TIPOS_VALIDOS = [
    'Eventos_Tech',
    'Pulse_Mais',
    'Encontro_Rede',
    'Workshop',
    'Palestra',
    'Outro'
];

class EventoService {

    // Aqui, criamos um novo evento aplicando as regras de negócio antes da persistência.
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarDados(dados);

        return eventoRepository.criar(dados);
    }

    // Aqui, buscamos um evento pelo ID.
    async buscarPorId(id) {
        const evento = await eventoRepository.buscarPorId(id);
        if (!evento) throw new NotFoundError('Evento');

        return evento;
    }

    // Aqui, listamos eventos com filtros opcionais.
    async listarTodos(filtros = {}) {
        if (filtros.tipo) {
            this._validarTipo(filtros.tipo);
        }

        if (filtros.data_inicio) {
            this._validarData(filtros.data_inicio, 'data_inicio');
        }

        if (filtros.data_fim) {
            this._validarData(filtros.data_fim, 'data_fim');
        }

        if (filtros.data_inicio && filtros.data_fim) {
            this._validarPeriodo(filtros.data_inicio, filtros.data_fim);
        }

        return eventoRepository.listarTodos(filtros);
    }

    // Aqui, atualizamos um evento existente.
    async atualizar(id, dados) {
        const eventoExistente = await eventoRepository.buscarPorId(id);
        if (!eventoExistente) throw new NotFoundError('Evento');

        this._validarDados(dados);

        const evento = await eventoRepository.atualizar(id, dados);
        if (!evento) throw new BadRequestError('Nenhum campo válido enviado para atualização');

        return evento;
    }

    // Aqui, excluímos um evento existente quando a remoção física for necessária.
    async excluir(id) {
        const eventoExistente = await eventoRepository.buscarPorId(id);
        if (!eventoExistente) throw new NotFoundError('Evento');

        return eventoRepository.excluir(id);
    }

    // Aqui, validamos se os campos obrigatórios foram enviados.
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['nome', 'data_inicio', 'tipo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);

        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, concentramos as validações de campos opcionais e obrigatórios do evento.
    _validarDados(dados) {
        if (dados.nome !== undefined) {
            this._validarNome(dados.nome);
        }

        if (dados.tipo !== undefined) {
            this._validarTipo(dados.tipo);
        }

        if (dados.data_inicio !== undefined) {
            this._validarData(dados.data_inicio, 'data_inicio');
        }

        if (dados.data_fim !== undefined && dados.data_fim !== null && dados.data_fim !== '') {
            this._validarData(dados.data_fim, 'data_fim');
        }

        if (dados.data_inicio && dados.data_fim) {
            this._validarPeriodo(dados.data_inicio, dados.data_fim);
        }

        if (dados.vagas !== undefined && dados.vagas !== null) {
            this._validarVagas(Number(dados.vagas));
            dados.vagas = Number(dados.vagas);
        }
    }

    // Aqui, validamos se o nome possui conteúdo útil.
    _validarNome(nome) {
        if (!nome || !nome.trim()) {
            throw new BadRequestError('O nome do evento não pode ser vazio');
        }
    }

    // Aqui, validamos se o tipo informado está entre os tipos permitidos.
    _validarTipo(tipo) {
        if (!TIPOS_VALIDOS.includes(tipo)) {
            throw new BadRequestError(
                `tipo inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`
            );
        }
    }

    // Aqui, validamos se uma data informada pode ser interpretada corretamente.
    _validarData(data, campo) {
        const dataValida = new Date(data);

        if (Number.isNaN(dataValida.getTime())) {
            throw new BadRequestError(`${campo} inválida`);
        }
    }

    // Aqui, validamos se a data final não vem antes da data inicial.
    _validarPeriodo(dataInicio, dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        if (fim < inicio) {
            throw new BadRequestError('A data final do evento não pode ser anterior à data inicial');
        }
    }

    // Aqui, validamos se a quantidade de vagas é um número inteiro positivo.
    _validarVagas(vagas) {
        if (!Number.isInteger(vagas) || vagas < 0) {
            throw new BadRequestError('A quantidade de vagas deve ser um número inteiro maior ou igual a zero');
        }
    }
}

module.exports = new EventoService();
