// src/models/EnsinoSuperior.js

class EnsinoSuperior {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.instituicao = dados.instituicao;
        this.cursos = dados.cursos;
        this.modalidade_bolsa = dados.modalidade_bolsa;
        this.status = dados.status;
        this.data_inicio = dados.data_inicio;
        this.data_conclusao = dados.data_conclusao;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em
        this.semestre_atual = dados.semestre_atual;
        this.numero_matricula_ies = dados.numero_matricula_ies;

    }
}

module.exports = EnsinoSuperior;