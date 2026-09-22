import { Request, Response } from 'express';
import { AlunoService } from '../services/aluno.service';

const camposAtualizaveis = new Set([
  'foto',
  'data_nasc',
  'id_turma',
  'status',
  'genero',
  'categoria',
  'email_primario',
  'email_secundario',
  'tel_primario',
  'tel_secundario',
  'cep',
  'endereco',
  'renda_familiar',
]);

const errosValidacao = new Set([
  'Formato de foto invalido. Envie PNG, JPG ou WEBP.',
  'A foto excede o tamanho maximo de 2 MB.',
]);

export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  async buscarPorRa(req: Request, res: Response): Promise<Response> {
    try {
      const ra = Number(req.params.ra);

      if (!Number.isInteger(ra) || ra <= 0) {
        return res.status(400).json({ error: 'RA invalido.' });
      }

      const aluno = await this.alunoService.buscarPorRA(ra);

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno nao encontrado.' });
      }

      return res.status(200).json(aluno);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar aluno.' });
    }
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const ra = Number(req.params.ra);
      const dados = req.body ?? {};
      const campos = Object.keys(dados);

      if (!Number.isInteger(ra) || ra <= 0) {
        return res.status(400).json({ error: 'RA invalido.' });
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: 'Informe ao menos um campo para atualizar.' });
      }

      const camposInvalidos = campos.filter(campo => !camposAtualizaveis.has(campo));

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          error: 'Campos invalidos para atualizacao.',
          campos: camposInvalidos,
        });
      }

      await this.alunoService.atualizar(ra, dados);

      return res.status(200).json({ message: 'Dados atualizados com sucesso.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';

      if (message === 'Aluno nao encontrado.') {
        return res.status(404).json({ error: message });
      }

      if (errosValidacao.has(message)) {
        return res.status(400).json({ error: message });
      }

      return res.status(500).json({ error: 'Erro interno ao tentar alterar dados.' });
    }
  }
}
