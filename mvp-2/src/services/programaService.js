// src/services/programaService.js

// Aqui, importamos o repository responsável por acessar os dados de programas.
const programaRepository = require('../repositories/programaRepository');

// Aqui, importamos os erros personalizados usados nas validações do service.
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos os tipos permitidos para programas da Pulse Mais.
const TIPOS_VALIDOS = [
    'Curso',
    'Mentoria',
    'Projeto',
    'Evento_Recorrente'
];

class ProgramaService {

    // Aqui, criamos um novo programa aplicando as regras de negócio antes da persistência.
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarDados(dados);

        return programaRepository.criar(dados);
    }

    // Aqui, buscamos um programa pelo ID.
    async buscarPorId(id) {
        const programa = await programaRepository.buscarPorId(id);
        if (!programa) throw new NotFoundError('Programa');

        return programa;
    }

    // Aqui, listamos programas com filtros opcionais.
    async listarTodos(filtros = {}) {
        if (filtros.ano) {
            filtros.ano = Number(filtros.ano);
            this._validarAno(filtros.ano);
        }

        if (filtros.tipo) {
            this._validarTipo(filtros.tipo);
        }

        if (filtros.ativo !== undefined) {
            filtros.ativo = filtros.ativo === 'true' || filtros.ativo === true;
        }

        return programaRepository.listarTodos(filtros);
    }

    // Aqui, atualizamos um programa existente.
    async atualizar(id, dados) {
        const programaExistente = await programaRepository.buscarPorId(id);
        if (!programaExistente) throw new NotFoundError('Programa');

        this._validarDados(dados);

        const programa = await programaRepository.atualizar(id, dados);
        if (!programa) throw new BadRequestError('Nenhum campo válido enviado para atualização');

        return programa;
    }

    // Aqui, arquivamos um programa existente sem excluir o registro do banco.
    async arquivar(id) {
        const programaExistente = await programaRepository.buscarPorId(id);
        if (!programaExistente) throw new NotFoundError('Programa');

        return programaRepository.arquivar(id);
    }

    // Aqui, validamos se os campos obrigatórios foram enviados.
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['nome', 'ano', 'tipo'];
        const ausentes = obrigatorios.filter(c => !dados[c]);

        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, concentramos as validações de campos opcionais e obrigatórios do programa.
    _validarDados(dados) {
        if (dados.nome !== undefined) {
            this._validarNome(dados.nome);
        }

        if (dados.ano !== undefined) {
            this._validarAno(Number(dados.ano));
            dados.ano = Number(dados.ano);
        }

        if (dados.tipo !== undefined) {
            this._validarTipo(dados.tipo);
        }

        if (dados.carga_horaria !== undefined && dados.carga_horaria !== null) {
            this._validarCargaHoraria(Number(dados.carga_horaria));
            dados.carga_horaria = Number(dados.carga_horaria);
        }

        if (dados.data_inicio && dados.data_fim) {
            this._validarPeriodo(dados.data_inicio, dados.data_fim);
        }
    }

    // Aqui, validamos se o nome possui conteúdo útil.
    _validarNome(nome) {
        if (!nome || !nome.trim()) {
            throw new BadRequestError('O nome do programa não pode ser vazio');
        }
    }

    // Aqui, validamos se o ano informado é um número inteiro positivo.
    _validarAno(ano) {
        if (!Number.isInteger(ano) || ano < 2000) {
            throw new BadRequestError('O ano do programa deve ser um número inteiro válido');
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

    // Aqui, validamos se a carga horária é um número positivo.
    _validarCargaHoraria(cargaHoraria) {
        if (!Number.isInteger(cargaHoraria) || cargaHoraria < 0) {
            throw new BadRequestError('A carga horária deve ser um número inteiro maior ou igual a zero');
        }
    }

    // Aqui, validamos se a data final não vem antes da data inicial.
    _validarPeriodo(dataInicio, dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
            throw new BadRequestError('Datas do programa inválidas');
        }

        if (fim < inicio) {
            throw new BadRequestError('A data final do programa não pode ser anterior à data inicial');
        }
    }
}

module.exports = new ProgramaService();
