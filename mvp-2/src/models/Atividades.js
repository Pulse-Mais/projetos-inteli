// src/models/Atividades.js

class Atividades {
    constructor(dados) {
        this.id = dados.id;
        this.programa_id = dados.programa_id;
        this.titulo = dados.titulo;
        this.descricao = dados.descricao;
        this.data_limite = dados.data_limite;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Atividades;