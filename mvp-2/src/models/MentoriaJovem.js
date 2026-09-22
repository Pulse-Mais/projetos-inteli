// src/models/MentoriaJovem.js

class MentoriaJovem {
    constructor(dados) {
        this.id = dados.id;
        this.mentoria_id = dados.mentoria_id;
        this.jovem_id = dados.jovem_id;
        this.criado_em = dados.criado_em;
    }
}

module.exports = MentoriaJovem;