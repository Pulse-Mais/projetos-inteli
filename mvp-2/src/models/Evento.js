// src/models/Evento.js

class Evento {
    constructor(dados) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.data_inicio = dados.data_inicio;
        this.data_fim = dados.data_fim;
        this.tipo = dados.tipo;
        this.descricao = dados.descricao;
        this.local = dados.local;
        this.vagas = dados.vagas;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
    }
}

module.exports = Evento;
