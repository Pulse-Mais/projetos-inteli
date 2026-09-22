// src/helpers/parseId.js

function parsePositiveInt(raw) {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
}

module.exports = { parsePositiveInt };