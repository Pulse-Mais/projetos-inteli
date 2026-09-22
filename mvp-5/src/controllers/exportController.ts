import { Request, Response } from 'express';
import * as exportService from '../services/exportService';



function queryStr(val: unknown): string | undefined {
  if (Array.isArray(val)) return String(val[0]);
  return val ? String(val) : undefined;
}

export async function exportarJovens(req: Request, res: Response): Promise<void> {
  const categoria_atual = queryStr(req.query.categoria_atual);
  const status_global   = queryStr(req.query.status_global);
  const id_programa     = req.query.id_programa ? Number(req.query.id_programa) : undefined;
  const ano_matricula   = req.query.ano_matricula ? Number(req.query.ano_matricula) : undefined;

  const csv = await exportService.exportarJovens({ categoria_atual, status_global, id_programa, ano_matricula });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio.csv');
  res.status(200).send(csv);
}

export function exportarTemplate(_req: Request, res: Response): void {
  const csv = exportService.gerarTemplate();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao.csv"');
  res.status(200).send(csv);
}
