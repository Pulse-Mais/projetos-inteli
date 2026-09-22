// src/models/Frequencia.js

class Frequencia {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.data_aula = dados.data_aula;
        this.tipo_presenca = dados.tipo_presenca;
        this.responsavel_id = dados.responsavel_id;
        this.programa_id = dados.programa_id;
        this.observacao = dados.observacao;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Frequencia;
