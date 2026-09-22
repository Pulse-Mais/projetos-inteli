// src/middlewares/authorize.js

const authorize = (...perfisPermitidos) => (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'Não autenticado'});
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
        return res.status(403).json({ error: 'Sem permissão para esta operação'});
    }

    next();
};

module.exports = { authorize };