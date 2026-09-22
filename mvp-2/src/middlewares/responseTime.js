// src/middlewares/responseTime.js
// Mede o tempo de resposta de cada endpoint e loga os lentos (> SLOW_THRESHOLD_MS).

const SLOW_THRESHOLD_MS = 500;

const responseTime = (req, res, next) => {
    const start = process.hrtime.bigint();

    // Intercepta res.end (chamado antes de enviar) em vez de 'finish' (após envio).
    // setHeader falha em 'finish' porque os headers já foram transmitidos.
    const originalEnd = res.end;
    res.end = function(chunk, encoding, callback) {
        const duracaoNs = process.hrtime.bigint() - start;
        const duracaoMs = Number(duracaoNs / 1_000_000n);

        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${duracaoMs}ms`);
        }

        const label = duracaoMs >= SLOW_THRESHOLD_MS ? '[LENTO]' : '[OK]';
        console.log(`${label} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duracaoMs}ms)`);

        return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
};

module.exports = { responseTime };
