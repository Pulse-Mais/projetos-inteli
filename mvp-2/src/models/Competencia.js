// src/models/Competencia.js

class Competencia {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.nome = dados.nome;
        this.tipo = dados.tipo;
        this.nivel = dados.nivel;
        this.instituicao = dados.instituicao;
        this.carga_horaria = dados.carga_horaria;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Competencia;