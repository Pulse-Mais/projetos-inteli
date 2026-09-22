/**
 * src/helpers/validarCpf.ts
 * Valida CPF conforme o algoritmo oficial dos dígitos verificadores.
 * Aceita formato com ou sem máscara (XXX.XXX.XXX-XX ou somente dígitos).
 * RN03 — o CPF é opcional no cadastro, mas quando informado deve estar
 *         no formato correto e ter dígitos verificadores válidos.
 */

import { ValidationError } from '../errors/AppError';

export function validarCpf(cpf: string): void {
  // Remove formatação — aceita com ou sem pontuação
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) {
    throw new ValidationError(
      'CPF inválido: deve conter 11 dígitos (formato aceito: XXX.XXX.XXX-XX)'
    );
  }

  // CPFs com todos os dígitos iguais são inválidos (ex.: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    throw new ValidationError('CPF inválido');
  }

  // ── Primeiro dígito verificador ──────────────────────────────────────────
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(digits[i]) * (10 - i);
  }
  const dig1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (Number(digits[9]) !== dig1) {
    throw new ValidationError('CPF inválido');
  }

  // ── Segundo dígito verificador ───────────────────────────────────────────
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(digits[i]) * (11 - i);
  }
  const dig2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (Number(digits[10]) !== dig2) {
    throw new ValidationError('CPF inválido');
  }
}
