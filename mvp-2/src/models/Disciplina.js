// src/models/Disciplina.js

class Disciplina {
    constructor(dados) {
        this.id = dados.id;
        this.ensino_superior_id = dados.ensino_superior_id;
        this.nome = dados.nome;
        this.status = dados.status;
        this.semestre = dados.semestre;
        this.criado_em = dados.criado_em;
    }
}

module.exports = Disciplina;
