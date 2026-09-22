// src/models/Mentoria.js

class Mentoria {
    constructor(dados) {
        this.id = dados.id;
        this.mentor_id = dados.mentor_id;
        this.status_mentoria = dados.status_mentoria;
        this.data_mentoria = dados.data_mentoria;
        this.duracao_minutos = dados.duracao_minutos;
        this.observacao_mentoria = dados.observacao_mentoria;
        this.mentor_nome = dados.mentor_nome;
        this.criado_em = dados.criado_em;
        this.temas = dados.temas || [];
        this.jovens = dados.jovens || [];

    }
}

module.exports = Mentoria;
