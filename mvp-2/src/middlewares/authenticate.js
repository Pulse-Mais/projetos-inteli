// src/middlewares/authenticate.js

const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const { rows } = await pool.query(
            'SELECT token_version, ativo FROM usuarios WHERE id = $1',
            [payload.id]
        );

        if (!rows[0] || !rows[0].ativo) {
            return res.status(401).json({ error: 'Usuário inativo ou não encontrado' });
        }

        if (rows[0].token_version !== payload.token_version) {
            return res.status(401).json({ error: 'Token inválido ou expirado' });
        }

        req.usuario = { id: payload.id, perfil: payload.perfil, nome: payload.nome, jovem_id: payload.jovem_id || null };
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

module.exports = { authenticate };
