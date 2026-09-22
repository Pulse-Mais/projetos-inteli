import { Request, Response } from 'express';
import { EmpregoService } from '../services/emprego.service';

export class EmpregoController {
  static readonly endpointPath = '/gestao/alunos/:ra/emprego';

  static async registrarEmprego(req: Request, res: Response): Promise<void> {
    const ra = Number(req.params.ra);
    const body = req.body ?? {};
    const data_inicio = body.data_inicio ?? body.dataInicio;
    const faixa_salarial = body.faixa_salarial ?? body.faixaSalarial;
    const { empresa, cargo } = body;

    const camposFaltando = [];

    if (!empresa) camposFaltando.push('empresa');
    if (!cargo) camposFaltando.push('cargo');
    if (!data_inicio) camposFaltando.push('data_inicio');
    if (!faixa_salarial) camposFaltando.push('faixa_salarial');

    if (camposFaltando.length > 0) {
      res.status(400).json({
        error: `Campos obrigatorios ausentes: ${camposFaltando.join(', ')}.`,
      });
      return;
    }

    try {
      const resultado = await EmpregoService.registrarEmprego(ra, {
        empresa,
        cargo,
        data_inicio,
        faixa_salarial,
      });

      res.status(201).json(resultado);
    } catch (error: any) {
      EmpregoController.responderErro(res, error, 'Erro interno ao registrar emprego.');
    }
  }

  static async listarEmpregos(req: Request, res: Response): Promise<void> {
    const ra = Number(req.params.ra);

    try {
      const service = EmpregoService as unknown as {
        listarEmpregos: (ra: number) => Promise<unknown>;
      };
      const resultado = await service.listarEmpregos(ra);

      res.status(200).json(resultado);
    } catch (error: any) {
      EmpregoController.responderErro(res, error, 'Erro interno ao listar empregos.');
    }
  }

  static async encerrarEmprego(req: Request, res: Response): Promise<void> {
    const ra = Number(req.params.ra);
    const id_emprego = Number(req.params.id_emprego);
    const body = req.body ?? {};
    const data_encerramento = body.data_encerramento ?? body.dataEncerramento;

    if (!data_encerramento) {
      res.status(400).json({
        error: 'Campo obrigatorio ausente: data_encerramento.',
      });
      return;
    }

    try {
      const resultado = await EmpregoService.encerrarEmprego(
        ra,
        id_emprego,
        data_encerramento,
      );

      res.status(200).json(resultado);
    } catch (error: any) {
      EmpregoController.responderErro(res, error, 'Erro interno ao encerrar emprego.');
    }
  }

  private static responderErro(res: Response, error: any, erroInterno: string): void {
    if (error.status) {
      res.status(error.status).json({
        error: error.message,
        ...(error.empregoAtivo ? { empregoAtivo: error.empregoAtivo } : {}),
      });
      return;
    }

    console.error('[EmpregoController]', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      table: error?.table,
      column: error?.column,
    });

    res.status(500).json({
      error: erroInterno,
      ...(process.env.NODE_ENV !== 'production'
        ? {
            debug: {
              message: error?.message,
              code: error?.code,
              table: error?.table,
              column: error?.column,
              detail: error?.detail,
            },
          }
        : {}),
    });
  }
}
