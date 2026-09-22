import { Request, Response } from 'express';
import {
  ArquivoImportacaoCsv,
  ComunicadoGestor,
  DestinatariosComunicado,
  FiltrosAluno,
} from '../database/models/gestor.model';
import { GestorService } from '../services/gestor.service';

interface ComunicadoRequestBody {
  titulo?: unknown;
  conteudo?: unknown;
  destinatarios?: unknown;
  tipo?: unknown;
  enviado_por?: unknown;
}

interface RequisicaoComArquivo extends Request {
  file?: ArquivoImportacaoCsv;
}

interface ErroComStatus extends Error {
  statusCode?: number;
}

export class GestorController {
  constructor(private readonly gestorService: GestorService) {}

  async buscarPorRm(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const gestor = await this.gestorService.buscarPorRm(rm);

      if (!gestor) {
        return res.status(404).json({ error: 'Gestor não encontrado.' });
      }

      return res.status(200).json(gestor);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar gestor.' });
    }
  }

  async listarAlunos(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const alunos = await this.gestorService.listarAlunos(rm);

      if (alunos.length === 0) {
        return res.status(404).json({ error: 'Nenhum aluno encontrado.' });
      }

      return res.status(200).json(alunos);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar dados dos alunos.' });
    }
  }

  async buscarAlunoPorRa(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);
      const ra = Number(req.params.ra);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      if (!Number.isInteger(ra) || ra <= 0) {
        return res.status(400).json({ error: 'RA invalido.' });
      }

      const aluno = await this.gestorService.buscarAlunoPorRa(rm, ra);

      if (!aluno) {
        return res.status(404).json({ error: 'Nenhum aluno encontrado.' });
      }

      return res.status(200).json(aluno);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar dados dos alunos.' });
    }
  }

  async filtrarAlunos(req: Request, res: Response): Promise<Response> {
    try {
      const rm = Number(req.params.rm);

      if (!Number.isInteger(rm) || rm <= 0) {
        return res.status(400).json({ error: 'RM invalido.' });
      }

      const filtros: FiltrosAluno = {};
      const camposInvalidos: string[] = [];
      const filtrosPermitidos = new Set([
        'idade_min',
        'idade_max',
        'empregabilidade',
        'id_turma',
        'eventos_min',
        'eventos_max',
        'genero',
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
      const genero = req.query.genero !== undefined
        ? obterFiltroTexto('genero', req.query.genero)
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
      if (genero !== undefined) filtros.genero = genero;

      const alunos = await this.gestorService.filtrarAlunos(rm, filtros);

      return res.status(200).json(alunos);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao filtrar alunos.' });
    }
  }

  async enviarComunicado(req: Request, res: Response): Promise<Response> {
    try {
      const perfil = String(req.get('x-perfil') ?? '').toLowerCase();
      const perfisPermitidos = ['gestor', 'coordenador', 'coordenadora'];

      if (!perfisPermitidos.includes(perfil)) {
        return res.status(403).json({
          error: 'Perfil sem permissão para enviar comunicados.',
        });
      }

      const { titulo, conteudo, destinatarios, tipo, enviado_por } =
        (req.body ?? {}) as ComunicadoRequestBody;

      const camposObrigatoriosAusentes =
        typeof titulo !== 'string' ||
        titulo.trim().length === 0 ||
        typeof conteudo !== 'string' ||
        conteudo.trim().length === 0 ||
        typeof destinatarios !== 'string' ||
        destinatarios.trim().length === 0;

      if (camposObrigatoriosAusentes) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes: titulo, conteudo, destinatarios.',
        });
      }

      if (titulo.length > 100) {
        return res.status(400).json({
          error: 'Titulo deve ter no maximo 100 caracteres.',
        });
      }

      const destinatariosPermitidos: DestinatariosComunicado[] = [
        'ativos',
        'ex-alunos',
        'todos',
      ];

      if (!destinatariosPermitidos.includes(destinatarios as DestinatariosComunicado)) {
        return res.status(400).json({
          error: 'Destinatarios invalido. Valores permitidos: ativos, ex-alunos, todos.',
        });
      }

      const comunicado: ComunicadoGestor = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        destinatarios: destinatarios as DestinatariosComunicado,
        tipo: typeof tipo === 'string' && tipo.trim() ? tipo.trim() : 'Informativo',
        enviado_por: Number.isInteger(Number(enviado_por)) ? Number(enviado_por) : undefined,
      };

      const registro = await this.gestorService.enviarComunicado(comunicado);

      return res.status(201).json({
        message: 'Comunicado enviado e registrado com sucesso.',
        ...(registro ? { comunicado: registro } : {}),
      });
    } catch {
      return res.status(500).json({
        error: 'Erro interno ao enviar ou registrar comunicado.',
      });
    }
  }

  async listarComunicados(_req: Request, res: Response): Promise<Response> {
    try {
      const comunicados = await this.gestorService.listarComunicados();
      return res.status(200).json(comunicados);
    } catch {
      return res.status(500).json({ error: 'Erro interno ao buscar comunicados.' });
    }
  }

  async excluirComunicado(req: Request, res: Response): Promise<Response> {
    try {
      const perfil = String(req.get('x-perfil') ?? '').toLowerCase();
      const idComunicado = Number(req.params.id);

      if (!['gestor', 'coordenador', 'coordenadora'].includes(perfil)) {
        return res.status(403).json({ error: 'Perfil sem permissao para excluir comunicados.' });
      }

      if (!Number.isInteger(idComunicado) || idComunicado <= 0) {
        return res.status(400).json({ error: 'Comunicado invalido.' });
      }

      const excluido = await this.gestorService.excluirComunicado(idComunicado);
      return excluido
        ? res.status(204).send()
        : res.status(404).json({ error: 'Comunicado nao encontrado.' });
    } catch {
      return res.status(500).json({ error: 'Erro interno ao excluir comunicado.' });
    }
  }

  async importarHistoricoCsv(req: Request, res: Response): Promise<Response> {
    try {
      const perfil = String(req.get('x-perfil') ?? '').toLowerCase();
      const perfisPermitidos = ['gestor', 'coordenador', 'coordenadora'];

      if (!perfisPermitidos.includes(perfil)) {
        return res.status(403).json({
          error: 'Perfil sem permissao para realizar importacoes.',
        });
      }

      const arquivo = (req as RequisicaoComArquivo).file;
      const nomeArquivo = arquivo?.originalname?.toLowerCase() ?? '';
      const mimetype = arquivo?.mimetype?.toLowerCase() ?? '';
      const arquivoCsv =
        nomeArquivo.endsWith('.csv') &&
        (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel');

      if (!arquivo || !arquivoCsv) {
        return res.status(400).json({
          error: 'Arquivo ausente ou formato invalido.',
        });
      }

      const resultado = await this.gestorService.importarHistoricoCsv(arquivo);

      return res.status(200).json(resultado);
    } catch (error) {
      const erro = error as ErroComStatus;

      if (erro.statusCode === 422) {
        return res.status(422).json({
          error: 'Estrutura do CSV nao corresponde ao modelo esperado.',
        });
      }

      return res.status(500).json({
        error: 'Erro interno ao processar o arquivo de importacao.',
      });
    }
  }

  async cadastrarAluno(req: Request, res: Response): Promise<Response> {
    try {
      const perfil = String(req.get('x-perfil') ?? '').toLowerCase();
      const perfisPermitidos = ['gestor', 'coordenador', 'coordenadora'];

      if (!perfisPermitidos.includes(perfil)) {
        return res.status(403).json({ error: 'Perfil sem permissao para cadastrar alunos.' });
      }

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

      const raCriado = await this.gestorService.cadastrarAluno(dados as any);

      return res.status(201).json({ message: 'Aluno cadastrado com sucesso.', ra: raCriado });
    } catch (error) {
      const err = error as any;

      if (err && err.statusCode === 409) {
        return res.status(409).json({ error: err.message || 'Conflito ao cadastrar aluno.' });
      }

      return res.status(500).json({ error: 'Erro interno ao cadastrar aluno.' });
    }
  }
};
