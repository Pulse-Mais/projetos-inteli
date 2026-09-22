/**
 * src/helpers/calcularIdade.ts
 * Calcula idade em anos completos e valida a faixa etária do programa.
 * RN04b — o jovem deve ter entre 14 e 29 anos no momento do cadastro.
 */

import { ValidationError } from '../errors/AppError';

export function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const diffMes = hoje.getMonth() - dataNascimento.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

/**
 * Lança ValidationError se a idade calculada estiver fora de 14–29 anos.
 * RN04b — elegibilidade ao programa Pulse Mais.
 */
export function validarIdade(dataNascimento: Date): void {
  const idade = calcularIdade(dataNascimento);
  if (idade < 14 || idade > 29) {
    throw new ValidationError(
      `Jovem deve ter entre 14 e 29 anos no momento do cadastro (idade calculada: ${idade} anos)`
    );
  }
}
