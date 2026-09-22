// src/models/Usuario.js

class Usuario {
    constructor(dados) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.email = dados.email;
        this.senha_hash = dados.senha_hash;
        this.perfil = dados.perfil;
        this.ativo = dados.ativo;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
        this.cargo = dados.cargo;
        this.telefone = dados.telefone;
        this.foto_url = dados.foto_url;
        this.fuso_horario = dados.fuso_horario;
        this.data_inicio_mentoria = dados.data_inicio_mentoria;
        this.jovem_id = dados.jovem_id;
        this.token_version = dados.token_version;
    }
}

module.exports = Usuario;