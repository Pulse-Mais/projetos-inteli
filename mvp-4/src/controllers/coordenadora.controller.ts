import { Request, Response } from 'express';
import { CoordenadoraService } from '../services/coordenadora.service';

export class CoordenadoraController {
  constructor(private readonly coordenadoraService: CoordenadoraService) { }

  async buscarPorRm(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const coordenadora = await this.coordenadoraService.buscarPorRm(rm);

      if (!coordenadora) {
        return res.status(404).json({ error: 'Coordenadora não encontrado.' });
      }

      return res.status(200).json(coordenadora);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar Coodenadora.' });
    }
  }

  async listarAlunos(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const alunos = await this.coordenadoraService.listarAlunos(rm);

      if (alunos.length === 0) {
        return res.status(404).json({ error: 'Nenhum aluno encontrado.' });
      }

      return res.status(200).json(alunos);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar alunos.' });
    }
  }

  async cadastrarAluno(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const body = req.body ?? {};
      const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
      const cpf = typeof body.cpf === 'string' ? body.cpf.replace(/\D/g, '') : '';
      const email = typeof body.email_primario === 'string' ? body.email_primario.trim() : '';

      if (!nome || !cpf || !email) {
        return res.status(400).json({ error: 'Campos obrigatorios ausentes: nome, cpf, email_primario.' });
      }

      const dados = {
        nome,
        cpf,
        email_primario: email,
        tel_primario: typeof body.tel_primario === 'string' ? body.tel_primario : undefined,
        genero: typeof body.genero === 'string' ? body.genero : undefined,
        data_nasc: typeof body.data_nasc === 'string' ? body.data_nasc : undefined,
        data_ingresso: typeof body.data_ingresso === 'string' ? body.data_ingresso : undefined,
        categoria: typeof body.categoria === 'string' ? body.categoria : undefined,
      };

      const raCriado = await this.coordenadoraService.cadastrarAluno(dados as any);

      return res.status(201).json({ message: 'Aluno cadastrado com sucesso.', ra: raCriado });
    } catch (error) {
      const err = error as any;

      if (err && err.statusCode === 409) {
        return res.status(409).json({ error: err.message || 'Conflito ao cadastrar aluno.' });
      }

      return res.status(500).json({ error: 'Erro interno ao cadastrar aluno.' });
    }
  }

  async registrarFrequencia(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);
      const { id_aula, data, frequencia } = req.body ?? {};

      if (!id_aula || !data || frequencia === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      await this.coordenadoraService.registrarFrequencia(rm, ra, {
        id_aula,
        data,
        frequencia,
      });

      return res.status(201).json({
        message: 'Frequência registrada com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao registrar frequência.',
      });
    }
  }

  async atualizarFrequencia(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);
      const idAula = Number(req.params.id_aula);
      const { frequencia } = req.body ?? {};

      const atualizado = await this.coordenadoraService.atualizarFrequencia(rm, ra, idAula, {
        frequencia,
      });

      if (!atualizado) {
        return res.status(404).json({ error: 'Frequência não encontrada.' });
      }

      return res.status(200).json({
        message: 'Frequência atualizada com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao atualizar frequência.',
      });
    }
  }

  async registrarObservacao(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);

      const {
        info_simplificada,
        observacoes,
        data,
      } = req.body ?? {};

      if (!info_simplificada || !data) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes.',
        });
      }

      await this.coordenadoraService.registrarObservacao(rm, ra, {
        info_simplificada,
        observacoes,
        data,
      });

      return res.status(201).json({
        message: 'Observação registrada com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao registrar observação.',
      });
    }
  }

  async registrarEvento(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const {
        tema,
        sede,
        data,
        categoria,
        descricao,
      } = req.body ?? {};

      if (!tema || !sede || !data || !categoria) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes.',
        });
      }

      await this.coordenadoraService.registrarEvento(rm, {
        tema,
        sede,
        data,
        categoria,
        descricao,
      });

      return res.status(201).json({
        message: 'Evento registrado com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao registrar evento.',
      });
    }
  }

  async listarComunicados(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const comunicados = await this.coordenadoraService.listarComunicados(rm);

      return res.status(200).json(comunicados);
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao listar comunicados.',
      });
    }
  }

  async excluirComunicado(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const idComunicado = Number(req.params.id_comunicado);

      if (
        !Number.isInteger(rm) ||
        rm <= 0 ||
        !Number.isInteger(idComunicado) ||
        idComunicado <= 0
      ) {
        return res.status(400).json({ error: 'Parametros invalidos.' });
      }

      const excluido = await this.coordenadoraService.excluirComunicado(rm, idComunicado);

      if (!excluido) {
        return res.status(404).json({ error: 'Comunicado nao encontrado.' });
      }

      return res.status(200).json({
        message: 'Comunicado excluido com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao excluir comunicado.',
      });
    }
  }

  async concluirModuloAluno(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);
      const modulo = Number(req.params.modulo);
      const data = req.body?.data || new Date().toISOString().slice(0, 10);

      if (
        !Number.isInteger(rm) ||
        rm <= 0 ||
        !Number.isInteger(ra) ||
        ra <= 0 ||
        !Number.isInteger(modulo) ||
        modulo < 1 ||
        modulo > 4
      ) {
        return res.status(400).json({ error: 'Parametros invalidos.' });
      }

      const atualizado = await this.coordenadoraService.concluirModuloAluno(
        rm,
        ra,
        modulo,
        data,
      );

      if (!atualizado) {
        return res.status(404).json({ error: 'Aluno ou coordenadora nao encontrado.' });
      }

      return res.status(200).json({
        message: 'Modulo concluido com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao concluir modulo.',
      });
    }
  }

  async desfazerConclusaoModuloAluno(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);
      const modulo = Number(req.params.modulo);

      if (
        !Number.isInteger(rm) ||
        rm <= 0 ||
        !Number.isInteger(ra) ||
        ra <= 0 ||
        !Number.isInteger(modulo) ||
        modulo < 1 ||
        modulo > 4
      ) {
        return res.status(400).json({ error: 'Parametros invalidos.' });
      }

      const atualizado = await this.coordenadoraService.desfazerConclusaoModuloAluno(
        rm,
        ra,
        modulo,
      );

      if (!atualizado) {
        return res.status(404).json({ error: 'Conclusao de modulo nao encontrada.' });
      }

      return res.status(200).json({
        message: 'Conclusao do modulo removida com sucesso.',
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao desfazer conclusao do modulo.',
      });
    }
  }

  async listarRelatorios(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);

      if (isNaN(rm) || isNaN(ra)) {
        return res.status(400).json({ error: 'Parâmetros inválidos.' });
      }

      const relatorios = await this.coordenadoraService.listarRelatorios(rm, ra);

      if (relatorios.length === 0) {
        return res.status(404).json({ error: 'Nenhum relatório encontrado.' });
      }

      return res.status(200).json(relatorios);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao listar relatórios.' });
    }
  }

  async filtrarAlunos(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const filtros: Record<string, string | number> = {};
      const camposInvalidos: string[] = [];
      const filtrosPermitidos = new Set([
        'idade_min',
        'idade_max',
        'empregabilidade',
        'id_turma',
        'localizacao',
        'eventos_min',
        'eventos_max',
        'genero',
        'status',
      ]);

      const obterTexto = (valor: unknown): string | undefined => {
        if (Array.isArray(valor)) {
          return obterTexto(valor[0]);
        }

        if (typeof valor !== 'string') {
          return undefined;
        }

        const texto = valor.trim();
        return texto.length > 0 ? texto : undefined;
      };

      const obterNumero = (campo: string, valor: unknown): number | undefined => {
        const texto = obterTexto(valor);

        if (texto === undefined) {
          camposInvalidos.push(campo);
          return undefined;
        }

        const numero = Number(texto);

        if (!Number.isInteger(numero) || numero < 0) {
          camposInvalidos.push(campo);
          return undefined;
        }

        return numero;
      };

      const obterFiltroTexto = (campo: string, valor: unknown): string | undefined => {
        const texto = obterTexto(valor);

        if (texto === undefined) {
          camposInvalidos.push(campo);
          return undefined;
        }

        return texto;
      };

      Object.keys(req.query).forEach((campo) => {
        if (!filtrosPermitidos.has(campo)) {
          camposInvalidos.push(campo);
        }
      });

      const idadeMin = req.query.idade_min !== undefined
        ? obterNumero('idade_min', req.query.idade_min)
        : undefined;
      const idadeMax = req.query.idade_max !== undefined
        ? obterNumero('idade_max', req.query.idade_max)
        : undefined;
      const idTurma = req.query.id_turma !== undefined
        ? obterNumero('id_turma', req.query.id_turma)
        : undefined;
      const eventosMin = req.query.eventos_min !== undefined
        ? obterNumero('eventos_min', req.query.eventos_min)
        : undefined;
      const eventosMax = req.query.eventos_max !== undefined
        ? obterNumero('eventos_max', req.query.eventos_max)
        : undefined;
      const empregabilidade = req.query.empregabilidade !== undefined
        ? obterFiltroTexto('empregabilidade', req.query.empregabilidade)
        : undefined;
      const localizacao = req.query.localizacao !== undefined
        ? obterFiltroTexto('localizacao', req.query.localizacao)
        : undefined;
      const genero = req.query.genero !== undefined
        ? obterFiltroTexto('genero', req.query.genero)
        : undefined;
      const status = req.query.status !== undefined
        ? obterFiltroTexto('status', req.query.status)
        : undefined;

      if (
        idadeMin !== undefined &&
        idadeMax !== undefined &&
        idadeMin > idadeMax
      ) {
        camposInvalidos.push('idade_min', 'idade_max');
      }

      if (
        eventosMin !== undefined &&
        eventosMax !== undefined &&
        eventosMin > eventosMax
      ) {
        camposInvalidos.push('eventos_min', 'eventos_max');
      }

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          error: 'Filtros invalidos.',
          campos: Array.from(new Set(camposInvalidos)),
        });
      }

      if (idadeMin !== undefined) filtros.idade_min = idadeMin;
      if (idadeMax !== undefined) filtros.idade_max = idadeMax;
      if (idTurma !== undefined) filtros.id_turma = idTurma;
      if (eventosMin !== undefined) filtros.eventos_min = eventosMin;
      if (eventosMax !== undefined) filtros.eventos_max = eventosMax;
      if (empregabilidade !== undefined) filtros.empregabilidade = empregabilidade;
      if (localizacao !== undefined) filtros.localizacao = localizacao;
      if (genero !== undefined) filtros.genero = genero;
      if (status !== undefined) filtros.status = status;

      const alunos = await this.coordenadoraService.filtrarAlunos(rm, filtros);

      if (alunos.length === 0) {
        return res.status(404).json({ error: 'Nenhum aluno encontrado.' });
      }

      return res.status(200).json(alunos);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao filtrar alunos.' });
    }
  }
}
