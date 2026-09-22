import { Request, Response } from 'express';
import FrequenciaService from '../services/frequenciaServices';

class FrequenciaController {
  async registrarAula(req: Request, res: Response): Promise<void> {
    try {
      const ra = parseInt(req.params.ra);
      const { id_aula, data, frequencia, id_coordenador } = req.body;

      if (id_aula === undefined || !data || frequencia === undefined || !id_coordenador) {
        res.status(400).json({ error: 'Campos obrigatórios ausentes: id_aula, data, frequencia, id_coordenador.' });
        return;
      }

      if (new Date(data) > new Date()) {
        res.status(422).json({ error: 'Não é possível registrar frequência em data futura.' });
        return;
      }

      const result = await FrequenciaService.registrarAula(ra, id_aula, data, frequencia, id_coordenador);

      if ('error' in result) {
        if (result.error === 'aluno_not_found' || result.error === 'aula_not_found') {
          res.status(404).json({ error: 'Aluno ou aula não encontrado.' });
          return;
        }
        if (result.error === 'duplicate') {
          res.status(409).json({ error: 'Frequência já registrada para este aluno nesta aula.' });
          return;
        }
      }

      res.status(201).json({ message: 'Frequência registrada com sucesso.' });
    } catch {
      res.status(500).json({ error: 'Erro interno ao registrar frequência.' });
    }
  }

  async getFrequenciaAulas(req: Request, res: Response): Promise<void> {
    try {
      const ra = parseInt(req.params.ra);
      const result = await FrequenciaService.getFrequenciaAulas(ra);

      if ('error' in result && result.error === 'not_found') {
        res.status(404).json({ error: 'Aluno não encontrado.' });
        return;
      }

      res.status(200).json({ ra, ...result });
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar frequência.' });
    }
  }

  async registrarEvento(req: Request, res: Response): Promise<void> {
    try {
      const ra = parseInt(req.params.ra);
      const { id_evento, data, frequencia, id_coordenador } = req.body;

      if (id_evento === undefined || !data || frequencia === undefined || !id_coordenador) {
        res.status(400).json({ error: 'Campos obrigatórios ausentes: id_evento, data, frequencia, id_coordenador.' });
        return;
      }

      if (new Date(data) > new Date()) {
        res.status(422).json({ error: 'Não é possível registrar participação em data futura.' });
        return;
      }

      const result = await FrequenciaService.registrarEvento(ra, id_evento, data, frequencia, id_coordenador);

      if ('error' in result) {
        if (result.error === 'aluno_not_found' || result.error === 'evento_not_found') {
          res.status(404).json({ error: 'Aluno ou evento não encontrado.' });
          return;
        }
        if (result.error === 'duplicate') {
          res.status(409).json({ error: 'Participação já registrada para este aluno neste evento.' });
          return;
        }
      }

      res.status(201).json({ message: 'Participação em evento registrada com sucesso.' });
    } catch {
      res.status(500).json({ error: 'Erro interno ao registrar participação em evento.' });
    }
  }

  async getFrequenciaTurma(req: Request, res: Response): Promise<void> {
    try {
      const id_turma = parseInt(req.params.id);
      const result = await FrequenciaService.getFrequenciaTurma(id_turma);

      if ('error' in result && result.error === 'not_found') {
        res.status(404).json({ error: 'Turma não encontrada.' });
        return;
      }

      res.status(200).json(result);
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar frequência da turma.' });
    }
  }
}

export default new FrequenciaController();
