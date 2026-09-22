// src/helpers/notificacaoHelper.js

const { pool } = require('../database/db');
const notificacaoRepository = require('../repositories/notificacaoRepository');

function gerarNotificacao(tipo, mensagem, usuario_id, { descricao, link } = {}) {
    if (!usuario_id) return;
    // criarSeInedita: não recria uma notificação equivalente já existente,
    // garantindo que cada notificação apareça apenas uma vez (mesmo após refresh).
    notificacaoRepository.criarSeInedita({
        usuario_id,
        tipo,
        titulo: mensagem,
        descricao: descricao || null,
        link: link || null,
    }).catch(() => {});
}

async function notificarGestores(tipo, mensagem, { descricao, link } = {}) {
    const { rows } = await pool.query(
        `SELECT id FROM usuarios WHERE perfil IN ('GestaoGeral', 'Coordenacao') AND ativo = true`
    );
    for (const { id } of rows) {
        gerarNotificacao(tipo, mensagem, id, { descricao, link });
    }
}

module.exports = { gerarNotificacao, notificarGestores };
