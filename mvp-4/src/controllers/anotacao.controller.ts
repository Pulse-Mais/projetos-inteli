import { Request, Response } from 'express';
import { AnotacaoService } from '../services/anotacao.service';

export class AnotacaoController {
  constructor(private readonly service: AnotacaoService) {}

  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const anotacoes = await this.service.listarPorAluno(Number(req.params.ra));
      return res.status(200).json({ anotacoes, total: anotacoes.length });
    } catch (error) {
      return this.responderErro(res, error);
    }
  }

  async criar(req: Request, res: Response): Promise<Response> {
    try {
      const anotacao = await this.service.criar(Number(req.params.ra), req.body ?? {});
      return res.status(201).json(anotacao);
    } catch (error) {
      return this.responderErro(res, error);
    }
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const anotacao = await this.service.atualizar(Number(req.params.id), req.body ?? {});
      return res.status(200).json(anotacao);
    } catch (error) {
      return this.responderErro(res, error);
    }
  }

  async remover(req: Request, res: Response): Promise<Response> {
    try {
      await this.service.remover(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      return this.responderErro(res, error);
    }
  }

  private responderErro(res: Response, error: unknown): Response {
    const erro = error as Error & { status?: number };
    return res.status(erro.status ?? 500).json({
      error: erro.status ? erro.message : 'Erro interno ao processar anotacao.',
    });
  }
}
