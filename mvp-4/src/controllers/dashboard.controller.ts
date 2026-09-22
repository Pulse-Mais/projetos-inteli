import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  async obterDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const { periodo_inicio, periodo_fim, id_turma } = req.query;

      if (!this.dataValida(periodo_inicio) || !this.dataValida(periodo_fim)) {
        return res.status(400).json({
          error: 'Formato de data invalido. Use YYYY-MM-DD.',
        });
      }

      if (!this.idTurmaValido(id_turma)) {
        return res.status(400).json({
          error: 'id_turma invalido.',
        });
      }

      const dashboard = await this.dashboardService.obterDashboard({
        periodo_inicio: this.obterTexto(periodo_inicio),
        periodo_fim: this.obterTexto(periodo_fim),
        id_turma: this.obterIdTurma(id_turma),
      });

      return res.status(200).json(dashboard);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Erro interno ao gerar dados do dashboard.',
      });
    }
  }

  //retorna frequencias para o dashboard, com possibilidade de filtrar por turma e por alertas
  async obterFrequenciasDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const { id_turma, apenas_alertas } = req.query;

      if (!this.idTurmaValido(id_turma)) {
        return res.status(400).json({
          error: 'id_turma invalido.',
        });
      }

      if (!this.booleanoValido(apenas_alertas)) {
        return res.status(400).json({
          error: 'apenas_alertas invalido. Use true ou false.',
        });
      }

      const frequencias = await this.dashboardService.obterFrequenciasDashboard({
        id_turma: this.obterIdTurma(id_turma),
        apenas_alertas: this.obterBooleano(apenas_alertas),
      });

      return res.status(200).json(frequencias);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Erro interno ao buscar frequencias para o dashboard.',
      });
    }
  }

  // retorna dados de empregabilidade para o endpoint 2
  async obterEmpregabilidadeDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const { id_turma } = req.query;

      if (!this.idTurmaValido(id_turma)) {
        return res.status(400).json({
          error: 'id_turma invalido.',
        });
      }

      const dashboard = await this.dashboardService.obterDashboard({
        id_turma: this.obterIdTurma(id_turma),
      });

      return res.status(200).json(dashboard.empregabilidade);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Erro interno ao buscar empregabilidade para o dashboard.',
      });
    }
  }

  // implementação para o endpoint de alertas do RF11
  async obterAlertasEvasao(req: Request, res: Response): Promise<Response> {
    try {
      const { id_turma, status, motivo } = req.query;

      if (!this.idTurmaValido(id_turma)) {
        return res.status(400).json({
          error: 'id_turma invalido.',
        });
      }

      if (!this.statusAlertaValido(status)) {
        return res.status(400).json({
          error: 'status invalido. Use ativo, resolvido ou todos.',
        });
      }

      if (!this.motivoAlertaValido(motivo)) {
        return res.status(400).json({
          error: 'motivo invalido. Use frequencia ou atividades.',
        });
      }

      const service = this.dashboardService as DashboardService & {
        obterAlertasEvasao(filtros: {
          id_turma?: number;
          status?: string;
          motivo?: string;
        }): Promise<unknown>;
      };

      const alertas = await service.obterAlertasEvasao({
        id_turma: this.obterIdTurma(id_turma),
        status: this.obterTexto(status),
        motivo: this.obterTexto(motivo),
      });

      return res.status(200).json(alertas);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Erro interno ao buscar alertas de evasao.',
      });
    }
  }

  async resolverAlerta(req: Request, res: Response): Promise<Response> {
    try {
      const dataResolucao = req.body?.data_resolucao ?? new Date().toISOString().slice(0, 10);
      await this.dashboardService.resolverAlerta(Number(req.params.id), dataResolucao);
      return res.status(200).json({ message: 'Alerta resolvido com sucesso.' });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      return res.status(500).json({ error: 'Erro interno ao resolver alerta.' });
    }
  }

  private dataValida(valor: unknown): boolean {
    if (valor === undefined) {
      return true;
    }

    if (typeof valor !== 'string') {
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const data = new Date(`${valor}T00:00:00.000Z`);

    return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(valor);
  }

  private idTurmaValido(valor: unknown): boolean {
    if (valor === undefined) {
      return true;
    }

    if (typeof valor !== 'string') {
      return false;
    }

    const idTurma = Number(valor);

    return Number.isInteger(idTurma) && idTurma > 0;
  }

  private obterTexto(valor: unknown): string | undefined {
    return typeof valor === 'string' ? valor : undefined;
  }

  private obterIdTurma(valor: unknown): number | undefined {
    return typeof valor === 'string' ? Number(valor) : undefined;
  }

  private booleanoValido(valor: unknown): boolean {
    if (valor === undefined) {
      return true;
    }

    return valor === 'true' || valor === 'false';
  }

  private obterBooleano(valor: unknown): boolean | undefined {
    if (valor === undefined) {
      return undefined;
    }

    return valor === 'true';
  }

  private statusAlertaValido(valor: unknown): boolean {
    if (valor === undefined) {
      return true;
    }

    return valor === 'ativo' || valor === 'resolvido' || valor === 'todos';
  }

  private motivoAlertaValido(valor: unknown): boolean {
    if (valor === undefined) {
      return true;
    }

    return valor === 'frequencia' || valor === 'atividades';
  }
}
