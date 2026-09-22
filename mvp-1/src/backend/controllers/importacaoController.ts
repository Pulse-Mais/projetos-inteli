import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/importacaoService';

/**
 * POST /importacao/alunos — importa alunos em lote via arquivo CSV ou XLSX (RN08).
 * Validação: requer multipart/form-data com campo `file`; aceita apenas .csv e .xlsx.
 * Retorna 200 com { importados } se todos foram inseridos sem conflito;
 * 207 com { importados, conflitos } se houver linhas rejeitadas (CPF/e-mail duplicados);
 * 400 se nenhum arquivo enviado ou formato inválido.
 */
export const importarAlunos = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const resultado = await svc.importarAlunos(
    file.buffer,
    file.mimetype,
    file.originalname
  );

  if (resultado.conflitos.length > 0) {
    res.status(207).json(resultado);
  } else {
    res.status(200).json(resultado);
  }
});
