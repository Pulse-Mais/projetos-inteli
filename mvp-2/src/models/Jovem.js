// Src/models/Jovem.js

class Jovem {
    constructor(dados) {
        this.id = dados.id;
        this.nome = dados.nome;
        this.cpf = dados.cpf;
        this.email = dados.email;
        this.telefone = dados.telefone;
        this.data_nascimento = dados.data_nascimento;
        this.genero = dados.genero;
        this.autodeclaracao_racial = dados.autodeclaracao_racial;
        this.renda_familiar = dados.renda_familiar;
        this.pcd = dados.pcd;
        this.bairro = dados.bairro;
        this.cidade = dados.cidade;
        this.estado = dados.estado;
        this.tipo_moradia = dados.tipo_moradia;
        this.multiplicador = dados.multiplicador;
        this.status_empregabilidade = dados.status_empregabilidade;
        this.status_jornada = dados.status_jornada;
        this.consentimento_lgpd = dados.consentimento_lgpd;
        // Foto vem da conta de usuário vinculada (usuarios.jovem_id); null se o jovem não tem conta
        this.foto_url = dados.foto_url ?? null;
        this.ativo = dados.ativo;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
    }
}

module.exports = Jovem;