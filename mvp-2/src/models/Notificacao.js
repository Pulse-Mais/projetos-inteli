// src/models/Notificacao.js

class Notificacao {
    constructor(dados) {
        this.id = dados.id;
        this.usuario_id = dados.usuario_id;
        this.tipo = dados.tipo;
        this.titulo = dados.titulo;
        this.descricao = dados.descricao;
        this.lida = dados.lida;
        this.link = dados.link;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Notificacao;