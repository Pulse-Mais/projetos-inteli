// src/helpers/cpfValidator.js

function isValidCpf(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;

    // Remove tudo que não é dígito
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) return false;
    
    // Rejeita CPFs com todos os dígitos igual (11111111111, etc.)
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Validação dos dígitos verificadores 
    for (let t = 9; t < 11; t++) {
        let sum = 0;
        for (let i = 0; i < t; i++) {
            sum += parseInt(digits[i]) * (t + 1 - i);
        }
        let remainder = (sum * 10) % 11 ;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(digits[t])) return false;
    }
    return true;
}

function sanitizeCpf(cpf) {
    if (!cpf) return null;
    return cpf.replace(/\D/g, '');
}

module.exports = { isValidCpf, sanitizeCpf };