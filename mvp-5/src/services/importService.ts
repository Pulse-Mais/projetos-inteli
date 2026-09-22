import * as jovemService from './jovemService';
import * as jovemRepo from '../repositories/jovemRepository';
import { parseCsv } from '../helpers/parseCsv';
import { ValidationError, ConflictError } from '../errors/AppError';
import type { ClassificacaoPulse, StatusGlobal } from '../models/enums';

interface LinhaJovemCsv {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco?: string;
  genero?: string;
  renda_inicial?: string;
  categoria_atual?: string;
  status_global?: string;
}

const CATEGORIAS: ClassificacaoPulse[] = ['Conectado', 'Capacitado', 'Transformado'];
const STATUSES: StatusGlobal[]         = ['Ativo', 'Formado', 'Evadido', 'Inativo'];

/** Aceita DD/MM/AAAA ou YYYY-MM-DD; devolve DD/MM/AAAA (formato do service) ou null. */
function normalizarData(valor: string | undefined | null): string | null {
  if (!valor?.trim()) return null;
  const v = valor.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return v;
}

export interface ResultadoImport {
  importados: number;
  atualizados: number;
  erros: Array<{ linha: number; mensagem: string }>;
}

export async function importarJovens(
  conteudoCsv: string,
  idUsuario: number
): Promise<ResultadoImport> {
  const linhas = parseCsv<LinhaJovemCsv>(conteudoCsv);

  if (linhas.length === 0) {
    throw new ValidationError('Arquivo CSV vazio ou sem linhas válidas.');
  }

  let importados = 0;
  let atualizados = 0;
  const erros: Array<{ linha: number; mensagem: string }> = [];

  for (const [i, linha] of linhas.entries()) {
    const numLinha = i + 2; // +1 cabeçalho, +1 base-1

    // ── Campos obrigatórios ──────────────────────────────────────
    if (!linha.nome?.trim()) {
      erros.push({ linha: numLinha, mensagem: 'campo "nome" é obrigatório' });
      continue;
    }
    if (!linha.email?.trim()) {
      erros.push({ linha: numLinha, mensagem: 'campo "email" é obrigatório' });
      continue;
    }

    // ── Validação de enums ───────────────────────────────────────
    const categoriaAtual = linha.categoria_atual?.trim() as ClassificacaoPulse | undefined;
    if (categoriaAtual && !CATEGORIAS.includes(categoriaAtual)) {
      erros.push({ linha: numLinha, mensagem: `categoria_atual inválida: "${categoriaAtual}"` });
      continue;
    }

    const statusGlobal = linha.status_global?.trim() as StatusGlobal | undefined;
    if (statusGlobal && !STATUSES.includes(statusGlobal)) {
      erros.push({ linha: numLinha, mensagem: `status_global inválido: "${statusGlobal}"` });
      continue;
    }

    try {
      let jovemId: number;
      let novaCriacao = false;

      try {
        // Tenta criar — valida CPF, idade, unicidade
        const criado = await jovemService.criar(
          {
            nome:            linha.nome.trim(),
            email:           linha.email.trim(),
            telefone:        linha.telefone?.trim()  || null,
            cpf:             linha.cpf?.trim()       || null,
            data_nascimento: normalizarData(linha.data_nascimento),
            endereco:        linha.endereco?.trim()  || null,
            genero:          linha.genero?.trim()    || null,
            renda_inicial:   linha.renda_inicial ? Number(linha.renda_inicial) : null,
          },
          idUsuario
        );
        jovemId = criado.id;
        novaCriacao = true;
        importados++;

      } catch (err) {
        // Conflito de email ou CPF — localiza existente e atualiza
        if (!(err instanceof ConflictError)) throw err;

        const existente = linha.cpf?.trim()
          ? (await jovemRepo.buscarPorCpf(linha.cpf.trim()) ?? await jovemRepo.buscarPorEmail(linha.email.trim()))
          : await jovemRepo.buscarPorEmail(linha.email.trim());

        if (!existente) throw err;
        jovemId = existente.id;

        await jovemService.atualizar(
          jovemId,
          {
            nome:            linha.nome.trim(),
            telefone:        linha.telefone?.trim()  || null,
            endereco:        linha.endereco?.trim()  || null,
            genero:          linha.genero?.trim()    || null,
            data_nascimento: normalizarData(linha.data_nascimento),
            ...(statusGlobal ? { status_global: statusGlobal } : {}),
          },
          idUsuario
        );
        atualizados++;
      }

      // Ajusta status_global para registros novos (criação fixa 'Ativo')
      if (novaCriacao && statusGlobal && statusGlobal !== 'Ativo') {
        await jovemService.atualizar(jovemId, { status_global: statusGlobal }, idUsuario);
      }

      // Ajusta categoria se diferente da atual (criação fixa 'Conectado')
      if (categoriaAtual) {
        const jovemAtual = await jovemRepo.buscarPorId(jovemId);
        if (jovemAtual && jovemAtual.categoria_atual !== categoriaAtual) {
          await jovemService.mudarCategoria(jovemId, categoriaAtual, idUsuario);
        }
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      erros.push({ linha: numLinha, mensagem: `(${linha.email ?? '?'}) ${msg}` });
    }
  }

  return { importados, atualizados, erros };
}
