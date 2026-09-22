// Src/server.js

const { app } = require('./app');
const { port } = require('./config');
const notificacaoService = require('./services/notificacaoService');

const VINTE_QUATRO_HORAS = 24 * 60 * 60 * 1000;

async function purgarNotificacoes() {
    try {
        const removidas = await notificacaoService.purgarAntigas();
        if (removidas > 0) console.log(`[notificacoes] ${removidas} notificação(ões) antigas removidas.`);
    } catch (err) {
        console.error('[notificacoes] Erro ao purgar antigas:', err.message);
    }
}

app.listen(port, async () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    await purgarNotificacoes();
    setInterval(purgarNotificacoes, VINTE_QUATRO_HORAS);
});