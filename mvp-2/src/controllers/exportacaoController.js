// src/controllers/exportacaoController.js

const exportacaoService = require('../services/exportacaoService');
const { asyncHandler } = require('../middlewares/asyncHandler');

const exportarJovens = asyncHandler(async (req, res) => {
    const csv = await exportacaoService.exportarJovens();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="jovens.csv"');
    res.send(csv);
});

const exportarEventosIcal = asyncHandler(async (req, res) => {
    const ics = await exportacaoService.exportarEventosIcal();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="eventos.ics"');
    res.send(ics);
});

module.exports = { exportarJovens, exportarEventosIcal };
