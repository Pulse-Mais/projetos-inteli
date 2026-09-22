// src/models/LogAuditoria.js

class LogAuditoria {
    constructor(dados) {
        this.id = dados.id;
        this.usuario_id = dados.usuario_id;
        this.entidade = dados.entidade;
        this.entidade_id = dados.entidade_id;
        this.operacao = dados.operacao;
        this.dados_anteriores = dados.dados_anteriores;
        this.dados_novos = dados.dados_novos;
        this.ip_origem = dados.ip_origem;
        this.rota = dados.rota;
        this.metodos_http = dados.metodos_http;
        this.criado_em = dados.criado_em;
    }
}

module.exports = LogAuditoria;
