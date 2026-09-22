// src/helpers/emailValidator.js

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;

    // Regex pragmática: algo@algo.algo, com pelo menos 2 chars no TLD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email.trim());
}

module.exports = { isValidEmail };