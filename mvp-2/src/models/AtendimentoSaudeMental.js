// src/models/AtendimentoSaudeMental.js

class AtendimentoSaudeMental {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.profissional_id = dados.profissional_id;
        this.data_atendimento = dados.data_atendimento;
        this.resumo = dados.resumo;
        this.encaminhamento = dados.encaminhamento;
        this.criado_em = dados.criado_em;
    }
}

module.exports = AtendimentoSaudeMental;
