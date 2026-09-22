// src/models/Anotacao.js

class Anotacao {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.autor_id = dados.autor_id;
        this.categoria = dados.categoria;
        this.tipo_alerta = dados.tipo_alerta;
        this.texto = dados.texto;
        this.criado_em = dados.criado_em;
        this.visivel_mentor = dados.visivel_mentor;
    }
}

module.exports = Anotacao;