// src/models/ParticipacaoEvento.js

// Aqui, criamos a classe que representa uma participação de jovem em evento.
class ParticipacaoEvento {
    constructor(dados) {
        // Aqui, mapeamos os campos da tabela participacoes_eventos para o objeto usado pela API.
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.evento_id = dados.evento_id;
        this.presente = dados.presente;
        this.criado_em = dados.criado_em;
    }
}

// Aqui, exportamos o model para ser usado pelo repository de participação em eventos.
module.exports = ParticipacaoEvento;
