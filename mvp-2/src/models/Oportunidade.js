// src/models/Oportunidade.js

class Oportunidade {
    constructor(dados) {
        this.id = dados.id;
        this.tipo = dados.tipo;
        this.titulo = dados.titulo;
        this.instituicao = dados.instituicao;
        this.descricao = dados.descricao;
        this.local = dados.local;
        this.data_inicio = dados.data_inicio;
        this.data_fim = dados.data_fim;
        this.duracao = dados.duracao;
        this.vagas = dados.vagas;
        this.valor = dados.valor;
        this.modalidade = dados.modalidade;
        this.link = dados.link;
        this.ativo = dados.ativo;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Oportunidade;