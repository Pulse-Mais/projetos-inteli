// src/middlewares/logAuditoria.js

const { pool } = require('../database/db');

const METODOS_AUDITAVEIS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const OPERACAO = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
};

function extrairEntidade(path) {
    const partes = path.replace(/^\/api\//, '').split('/');
    const entidade = partes[0] || null;
    const entidade_id = partes[1] && /^\d+$/.test(partes[1]) ? parseInt(partes[1], 10) : null;
    return { entidade, entidade_id };
}

const logAuditoria = (req, res, next) => {
    if (!METODOS_AUDITAVEIS.has(req.method)) return next();

    const originalJson = res.json.bind(res);

    res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const { entidade, entidade_id } = extrairEntidade(req.path);
            pool.query(
                `INSERT INTO log_auditoria
                    (usuario_id, entidade, entidade_id, operacao, dados_novos, ip_origem, rota, metodos_http)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    req.usuario?.id || null,
                    entidade,
                    entidade_id,
                    OPERACAO[req.method],
                    ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : null,
                    req.ip,
                    req.path,
                    req.method,
                ]
            ).catch(() => {});
        }
        return originalJson(body);
    };

    next();
};

module.exports = { logAuditoria };
