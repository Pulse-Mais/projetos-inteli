// src/models/EntregaAtividade.js

class EntregaAtividade {
    constructor(dados) {
        this.id = dados.id;
        this.atividades_id = dados.atividades_id;
        this.jovem_id = dados.jovem_id;
        this.status = dados.status;
        this.nota = dados.nota;
        this.data_entrega = dados.data_entrega;
        this.observacao = dados.observacao;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
    }
}

module.exports = EntregaAtividade;