import { parse } from 'csv-parse/sync';

export function parseCsv<T = Record<string, string>>(conteudo: string): T[] {
  return parse(conteudo, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}