// src/models/Programa.js

class Programa {
    constructor(dados) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.ano = dados.ano;
        this.tipo = dados.tipo;
        this.carga_horaria = dados.carga_horaria;
        this.coorte = dados.coorte;
        this.data_inicio = dados.data_inicio;
        this.data_fim = dados.data_fim;
        this.descricao = dados.descricao;
        this.ativo = dados.ativo;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
        this.total_etapas = dados.total_etapas;
    }
}

module.exports = Programa;
