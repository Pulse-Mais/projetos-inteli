// src/models/Matricula.js

class Matricula {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.programa_id = dados.programa_id;
        this.status = dados.status;
        this.turma = dados.turma;
        this.data_matricula = dados.data_matricula;
        this.data_conclusao = dados.data_conclusao;
        this.observacoes = dados.observacoes;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
        this.codigo = dados.codigo;
    }
}

module.exports = Matricula;
