import { NextFunction, Request, Response, Router } from 'express';
import { ArquivoImportacaoCsv } from '../database/models/gestor.model';
import { GestorController } from '../controllers/gestor.controller';
import { GestorRepository } from '../repositories/gestor.repository';
import { GestorService } from '../services/gestor.service';

interface RequisicaoComArquivo extends Request {
  file?: ArquivoImportacaoCsv;
}

const repository = new GestorRepository();
const service = new GestorService(repository);
const controller = new GestorController(service);

const router = Router();

const extrairBoundary = (contentType: string): string | null => {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  return match?.[1] ?? match?.[2]?.trim() ?? null;
};

const extrairArquivoMultipart = (
  corpo: Buffer,
  boundary: string,
): ArquivoImportacaoCsv | undefined => {
  const partes = corpo.toString('binary').split(`--${boundary}`);

  for (const parte of partes) {
    const conteudoParte = parte.startsWith('\r\n') ? parte.slice(2) : parte;
    const separador = conteudoParte.indexOf('\r\n\r\n');

    if (separador === -1) {
      continue;
    }

    const cabecalhos = conteudoParte.slice(0, separador);
    const disposicao = cabecalhos.match(/Content-Disposition:[^\n]+/i)?.[0] ?? '';

    if (!/name="file"/.test(disposicao)) {
      continue;
    }

    const nomeArquivo = disposicao.match(/filename="([^"]+)"/)?.[1];

    if (!nomeArquivo) {
      continue;
    }

    const mimetype = cabecalhos.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim();
    let conteudoArquivo = conteudoParte.slice(separador + 4);

    if (conteudoArquivo.endsWith('\r\n')) {
      conteudoArquivo = conteudoArquivo.slice(0, -2);
    }

    return {
      originalname: nomeArquivo,
      mimetype,
      buffer: Buffer.from(conteudoArquivo, 'binary'),
    };
  }

  return undefined;
};

const arquivoCsvMultipart = (req: Request, _res: Response, next: NextFunction): void => {
  const contentType = req.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    next();
    return;
  }

  const boundary = extrairBoundary(contentType);

  if (!boundary) {
    next();
    return;
  }

  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  req.on('end', () => {
    try {
      const arquivo = extrairArquivoMultipart(Buffer.concat(chunks), boundary);

      if (arquivo) {
        (req as RequisicaoComArquivo).file = arquivo;
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  req.on('error', next);
};

router.get('/gestor/comunicados', (req, res, next) => {
  controller.listarComunicados(req, res).catch(next);
});

// POST /gestor/comunicados - RF016
router.post('/gestor/comunicados', (req, res, next) => {
  console.log('[ROUTE] POST /gestor/comunicados - Requisicao recebida');
  controller.enviarComunicado(req, res).catch(next);
});

router.delete('/gestor/comunicados/:id', (req, res, next) => {
  controller.excluirComunicado(req, res).catch(next);
});

// POST /gestor/importacao - RF017
router.post('/gestor/importacao', arquivoCsvMultipart, (req, res, next) => {
  console.log('[ROUTE] POST /gestor/importacao - Requisicao recebida');
  controller.importarHistoricoCsv(req, res).catch(next);
});

// POST /gestor/:rm/alunos - cadastra um novo aluno
router.post('/gestor/:rm/alunos', (req, res, next) => {
  console.log('[ROUTE] POST /gestor/:rm/alunos - Requisicao recebida', { rm: req.params.rm, body: req.body });
  controller.cadastrarAluno(req, res).catch(next);
});

// GET /gestor/:rm - RF002
router.get('/gestor/:rm', (req, res, next) => {
  console.log('[ROUTE] GET /gestor/:rm - Requisicao recebida', { rm: req.params.rm });
  controller.buscarPorRm(req, res).catch(next);
});

// GET /gestor/:rm/alunos/filtros - RF015
router.get('/gestor/:rm/alunos/filtros', (req, res, next) => {
  console.log('[ROUTE] GET /gestor/:rm/alunos/filtros - Requisicao recebida', {
    rm: req.params.rm,
    filtros: req.query,
  });
  controller.filtrarAlunos(req, res).catch(next);
});

// GET /gestor/:rm/alunos - RF002
router.get('/gestor/:rm/alunos', (req, res, next) => {
  console.log('[ROUTE] GET /gestor/:rm/alunos - Requisicao recebida', { rm: req.params.rm });
  controller.listarAlunos(req, res).catch(next);
});

// GET /gestor/:rm/alunos/:ra - RF002
router.get('/gestor/:rm/alunos/:ra', (req, res, next) => {
  console.log('[ROUTE] GET /gestor/:rm/alunos/:ra - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
  });
  controller.buscarAlunoPorRa(req, res).catch(next);
});

export default router;
