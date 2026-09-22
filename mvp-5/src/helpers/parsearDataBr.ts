import { ValidationError } from '../errors/AppError';

export function parsearDataBr(valor: string): Date {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!match) {
    throw new ValidationError('data_nascimento deve estar no formato DD/MM/AAAA');
  }
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);
  // Garante que JS não "rolou" a data (ex: 31/06 vira 01/07)
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    throw new ValidationError('data_nascimento inválida');
  }
  return data;
}
