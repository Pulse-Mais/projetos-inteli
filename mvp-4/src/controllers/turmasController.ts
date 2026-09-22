import { Request, Response } from 'express';
import TurmasService from '../services/turmasServices';

class TurmasController {
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, total, totalAlunosGeral } = await TurmasService.listar(page, limit);
      res.status(200).json({
        data,
        pagination: { page, limit, total },
        summary: { total_alunos_geral: totalAlunosGeral },
      });
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar turmas.' });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const turma = await TurmasService.buscarPorId(id);
      if (!turma) {
        res.status(404).json({ error: 'Turma não encontrada.' });
        return;
      }
      res.status(200).json(turma);
    } catch {
      res.status(500).json({ error: 'Erro interno ao buscar turma.' });
    }
  }

  async criar(req: Request, res: Response): Promise<void> {
    try {
      const {
        nome_turma,
        data_inicio,
        data_fim,
        id_coordenador,
        capacidade,
        descricao,
        status,
      } = req.body;

      if (!nome_turma || !data_inicio || !data_fim || !id_coordenador) {
        res.status(400).json({ error: 'Campos obrigatórios ausentes: nome_turma, data_inicio, data_fim, id_coordenador.' });
        return;
      }

      if (new Date(data_fim) <= new Date(data_inicio)) {
        res.status(422).json({ error: 'data_fim deve ser posterior a data_inicio.' });
        return;
      }

      if (capacidade !== undefined && (!Number.isInteger(capacidade) || capacidade <= 0)) {
        res.status(400).json({ error: 'capacidade deve ser um inteiro maior que zero.' });
        return;
      }

      if (status !== undefined && !['ativa', 'encerrada', 'suspensa'].includes(status)) {
        res.status(400).json({ error: 'status deve ser ativa, encerrada ou suspensa.' });
        return;
      }

      const result = await TurmasService.criar({
        nome_turma,
        data_inicio,
        data_fim,
        id_coordenador,
        capacidade,
        descricao,
        status,
      });

      if ('error' in result && result.error === 'coordenador_not_found') {
        res.status(404).json({ error: 'Coordenador não encontrado.' });
        return;
      }

      res.status(201).json({ message: 'Turma cadastrada com sucesso.', id_turma: (result as { id_turma: number }).id_turma });
    } catch {
      res.status(500).json({ error: 'Erro interno ao cadastrar turma.' });
    }
  }

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const {
        nome_turma,
        data_inicio,
        data_fim,
        id_coordenador,
        capacidade,
        descricao,
        status,
      } = req.body;

      if (!nome_turma || !data_inicio || !data_fim || !id_coordenador) {
        res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        return;
      }

      if (new Date(data_fim) <= new Date(data_inicio)) {
        res.status(422).json({ error: 'data_fim deve ser posterior a data_inicio.' });
        return;
      }

      if (capacidade !== undefined && (!Number.isInteger(capacidade) || capacidade <= 0)) {
        res.status(400).json({ error: 'capacidade deve ser um inteiro maior que zero.' });
        return;
      }

      if (status !== undefined && !['ativa', 'encerrada', 'suspensa'].includes(status)) {
        res.status(400).json({ error: 'status deve ser ativa, encerrada ou suspensa.' });
        return;
      }

      const result = await TurmasService.atualizar(id, {
        nome_turma,
        data_inicio,
        data_fim,
        id_coordenador,
        capacidade,
        descricao,
        status,
      });

      if ('error' in result && result.error === 'not_found') {
        res.status(404).json({ error: 'Turma não encontrada.' });
        return;
      }
      if ('error' in result && result.error === 'coordenador_not_found') {
        res.status(404).json({ error: 'Coordenador não encontrado.' });
        return;
      }

      res.status(200).json({ message: 'Turma atualizada com sucesso.' });
    } catch {
      res.status(500).json({ error: 'Erro interno ao atualizar turma.' });
    }
  }

  async associarAluno(req: Request, res: Response): Promise<void> {
    try {
      const id_turma = parseInt(req.params.id);
      const { ra } = req.body;

      if (!ra) {
        res.status(400).json({ error: "Campo 'ra' é obrigatório." });
        return;
      }

      const result = await TurmasService.associarAluno(id_turma, ra);

      if ('error' in result) {
        if (result.error === 'turma_not_found' || result.error === 'aluno_not_found') {
          res.status(404).json({ error: 'Turma ou aluno não encontrado.' });
          return;
        }
        if (result.error === 'already_associated') {
          res.status(409).json({ error: 'Aluno já está associado a esta turma.' });
          return;
        }
        if (result.error === 'turma_cheia') {
          res.status(409).json({ error: 'Turma atingiu sua capacidade maxima.' });
          return;
        }
        if (result.error === 'turma_inativa') {
          res.status(409).json({ error: 'Apenas turmas ativas aceitam novos alunos.' });
          return;
        }
      }

      res.status(201).json({ message: 'Aluno associado à turma com sucesso.' });
    } catch {
      res.status(500).json({ error: 'Erro interno ao associar aluno.' });
    }
  }
}

export default new TurmasController();
