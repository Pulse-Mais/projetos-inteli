// src/models/Empregabilidade.js

class Empregabilidade {
    constructor(dados) {
        this.id = dados.id;
        this.jovem_id = dados.jovem_id;
        this.empresa = dados.empresa;
        this.cargo = dados.cargo;
        this.data_admissao = dados.data_admissao;
        this.data_saida = dados.data_saida;
        this.faixa_salarial = dados.faixa_salarial;
        this.tipo_vinculo = dados.tipo_vinculo;
        this.modalidade = dados.modalidade;
        this.carga_horaria_semanal = dados.carga_horaria_semanal;
        this.area_tech = dados.area_tech;
        this.ativo = dados.ativo;
        this.criado_em = dados.criado_em;
        this.atualizado_em = dados.atualizado_em;
    }
}

module.exports = Empregabilidade;
