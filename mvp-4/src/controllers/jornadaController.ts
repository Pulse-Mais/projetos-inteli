import { Request, Response } from 'express';
import JornadaService from '../services/jornadaServices';

class JornadaController {
  async getJornada(req: Request, res: Response): Promise<void> {
    try {
      const ra = parseInt(req.params.ra);
      const aluno = await JornadaService.getAluno(ra);
      if (!aluno) {
        res.status(404).json({ error: 'Aluno não encontrado.' });
        return;
      }
      const jornada = await JornadaService.getJornada(ra);
      res.status(200).json({ ra: aluno.ra, nome: aluno.nome, ...jornada });
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar jornada do aluno.' });
    }
  }

  async getCertificados(req: Request, res: Response): Promise<void> {
    try {
      const ra = parseInt(req.params.ra);
      const aluno = await JornadaService.getAluno(ra);
      if (!aluno) {
        res.status(404).json({ error: 'Aluno não encontrado.' });
        return;
      }
      const certificados = await JornadaService.getCertificados(ra);
      res.status(200).json({ ra, certificados });
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar certificados.' });
    }
  }

  // método para endpoint do RF12
  async getAlertas(req: Request, res: Response): Promise<void> {
    try {
      const ra = Number(req.params.ra);

      if (!Number.isInteger(ra) || ra <= 0) {
        res.status(400).json({ error: 'ra invalido.' });
        return;
      }

      const aluno = await JornadaService.getAluno(ra);

      if (!aluno) {
        res.status(404).json({ error: 'Aluno nao encontrado.' });
        return;
      }

      const service = JornadaService as typeof JornadaService & {
        getAlertas?: (ra: number) => Promise<Record<string, unknown>>;
      };

      if (typeof service.getAlertas !== 'function') {
        res.status(501).json({
          error: 'Camada service de alertas do aluno ainda nao implementada.',
        });
        return;
      }

      const alertas = await service.getAlertas(ra);
      res.status(200).json({ ra: aluno.ra, nome: aluno.nome, ...alertas });
    } catch (error) {
      console.error('[JornadaController] Falha ao buscar alertas do aluno', {
        ra: req.params.ra,
        error,
      });
      res.status(500).json({ error: 'Erro interno ao buscar alertas do aluno.' });
    }
  }
}

export default new JornadaController();
