import { stringify } from 'csv-stringify/sync';

export function gerarCsv(dados: Record<string, unknown>[]): string {
  if (dados.length === 0) return '';
  return stringify(dados, { header: true });
}