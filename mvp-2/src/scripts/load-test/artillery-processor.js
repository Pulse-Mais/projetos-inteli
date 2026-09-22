/**
 * artillery-processor.js
 * Carrega credenciais do arquivo .env.load-test antes de cada cenário.
 * Crie o arquivo copiando .env.load-test.example e preenchendo com dados reais.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.load-test') });

module.exports = {
    definirVariaveis(context, events, done) {
        context.vars.email_aluno   = process.env.LOAD_EMAIL_ALUNO   || '';
        context.vars.senha_aluno   = process.env.LOAD_SENHA_ALUNO   || '';
        context.vars.email_mentor  = process.env.LOAD_EMAIL_MENTOR  || '';
        context.vars.senha_mentor  = process.env.LOAD_SENHA_MENTOR  || '';
        context.vars.email_gestao  = process.env.LOAD_EMAIL_GESTAO  || '';
        context.vars.senha_gestao  = process.env.LOAD_SENHA_GESTAO  || '';
        return done();
    }
};
