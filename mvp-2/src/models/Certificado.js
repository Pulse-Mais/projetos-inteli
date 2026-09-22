// src/models/Certificado.js

class Certificado {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.nome = dados.nome;
        this.instituicao = dados.instituicao;
        this.data_conclusao = dados.data_conclusao;
        this.link_documento = dados.link_documento;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Certificado;
