import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import * as alunoSvc from './alunoService';
import * as programaRepo from '../repositories/programaRepository';
import { BadRequestError } from '../errors/AppError';

export interface ConflitoCsvRow {
  linha: number;
  cpf: string;
  motivo: string;
}

export interface ImportacaoResultado {
  importados: number;
  ignorados: number;
  conflitos: ConflitoCsvRow[];
}

// Linha crua da planilha: chaves variam conforme o cabeçalho original (CSV ou XLSX),
// por isso o tipo é totalmente livre — a normalização de cabeçalho cuida do resto.
type LinhaCrua = Record<string, unknown>;

/**
 * Aliases de cabeçalho aceitos por campo (normalizados: minúsculo, sem acento).
 * Permite que a planilha do coordenador use variações comuns de nome de coluna
 * sem precisar seguir um template rígido. Nenhuma coluna é obrigatória (RN: import
 * é mais permissivo que o cadastro manual).
 */
const ALIASES_POR_CAMPO: Record<string, string[]> = {
  nome: ['nome', 'nome completo', 'nome e sobrenome', 'aluno', 'nome do aluno', 'nome anonimo'],
  email: ['email', 'e-mail', 'e mail'],
  cpf: ['cpf'],
  senha: ['senha', 'password'],
  telefone: ['telefone', 'celular', 'whatsapp', 'fone', 'contato', 'telefone anonimo'],
  data_nascimento: ['data de nascimento', 'data nascimento', 'nascimento', 'dt nascimento'],
  cidade_nascimento: ['cidade', 'cidade de nascimento', 'naturalidade'],
  estado_nascimento: ['estado', 'uf', 'estado de nascimento'],
  programa_ingresso: ['programa', 'programa atual', 'programa de ingresso', 'turma', 'programa capacitado'],
  data_ingresso: ['data de ingresso', 'data ingresso', 'ingresso'],
  escolaridade: ['escolaridade'],
  status_profissional: ['status profissional', 'situacao profissional', 'status'],
  observacoes: ['observacoes', 'obs'],
  estagio_jornada: ['estagio da jornada', 'estagio', 'jornada', 'categoria'],
};

/** Remove acentos, baixa a caixa e colapsa espaços para comparar cabeçalhos com tolerância a variações. */
function normalizarTexto(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Mapa reverso: cabeçalho normalizado -> nome do campo interno.
const CABECALHO_PARA_CAMPO = new Map<string, string>();
for (const [campo, aliases] of Object.entries(ALIASES_POR_CAMPO)) {
  for (const alias of aliases) CABECALHO_PARA_CAMPO.set(alias, campo);
}

/** Reconstroi a linha crua (chaves arbitrárias da planilha) em um objeto com os nomes de campo internos. */
function mapearLinha(linha: LinhaCrua): Record<string, unknown> {
  const mapeada: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(linha)) {
    const campo = CABECALHO_PARA_CAMPO.get(normalizarTexto(chave));
    if (campo && valor !== null && valor !== undefined && String(valor).trim() !== '') {
      mapeada[campo] = valor;
    }
  }
  return mapeada;
}

/** Converte célula de data (Date do XLSX, serial do Excel ou texto ISO/BR) para "YYYY-MM-DD". */
function normalizarData(valor: unknown): string | undefined {
  if (valor instanceof Date) return valor.toISOString().split('T')[0];
  const texto = String(valor ?? '').trim();
  if (!texto) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const partesBr = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (partesBr) return `${partesBr[3]}-${partesBr[2].padStart(2, '0')}-${partesBr[1].padStart(2, '0')}`;
  return undefined;
}

/** Reconhece variações de texto livre (ex: "Jovens Transformados") e mapeia para o enum de estagio_jornada. */
function normalizarEstagio(valor: unknown): string | undefined {
  const texto = normalizarTexto(valor);
  if (!texto) return undefined;
  if (texto.includes('mentor')) return 'mentor';
  if (texto.includes('transformad')) return 'transformado';
  if (texto.includes('capacitad')) return 'capacitado';
  if (texto.includes('conectad')) return 'conectado';
  return undefined;
}

/**
 * Valida a extensão e o MIME type do arquivo enviado (RN08).
 * Aceita apenas .csv e .xlsx.
 * @returns 'csv' | 'xlsx'
 * @throws {BadRequestError} se o formato não for suportado
 */
function validarExtensao(mimetype: string, originalname: string): 'csv' | 'xlsx' {
  const nome = originalname.toLowerCase();
  if (nome.endsWith('.csv') || mimetype === 'text/csv') return 'csv';
  if (nome.endsWith('.xlsx') || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  throw new BadRequestError('Formato inválido. Envie um arquivo CSV ou XLSX (RN08)');
}

/** Parseia um buffer CSV em array de linhas usando stream. */
async function parsearCsv(buffer: Buffer): Promise<LinhaCrua[]> {
  return new Promise((resolve, reject) => {
    const rows: LinhaCrua[] = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csvParser())
      .on('data', (row: LinhaCrua) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/** Parseia um buffer XLSX lendo apenas a primeira planilha (datas convertidas para objetos Date). */
function parsearXlsx(buffer: Buffer): LinhaCrua[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<LinhaCrua>(sheet, { defval: null });
}

/** Gera dados de identificação únicos e claramente artificiais para linhas sem nome/e-mail/CPF. */
function gerarPlaceholder(linha: number) {
  const sufixo = `${Date.now()}${linha}`;
  return {
    nome: `Aluno Importado ${linha}`,
    email: `importado.${sufixo}@pendente.pulsemais.org.br`,
    cpf: sufixo.slice(-11).padStart(11, '0'),
  };
}

/**
 * Importa alunos em lote a partir de um arquivo CSV ou XLSX.
 * Diferente do cadastro manual, NENHUM campo é obrigatório na planilha: nome, e-mail
 * e CPF ausentes recebem um placeholder único para satisfazer as colunas NOT NULL de
 * `usuario`; os demais campos (telefone, escolaridade, programa, estágio da jornada...)
 * ficam em branco quando ausentes. Linhas totalmente vazias são ignoradas.
 * Cada linha reaproveita `alunoService.criarAluno`, então as mesmas regras de negócio
 * (RN de unicidade, vínculo de matrícula por programa) se aplicam aqui.
 * Linhas com CPF ou e-mail duplicados são registradas em `conflitos` sem interromper o processo.
 */
export async function importarAlunos(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<ImportacaoResultado> {
  const tipo = validarExtensao(mimetype, originalname);
  const linhasCruas = tipo === 'csv' ? await parsearCsv(buffer) : parsearXlsx(buffer);

  const programas = await programaRepo.findAll();

  let importados = 0;
  let ignorados = 0;
  const conflitos: ConflitoCsvRow[] = [];

  for (let i = 0; i < linhasCruas.length; i++) {
    const linha = i + 2; // linha 1 = cabeçalho
    const dados = mapearLinha(linhasCruas[i]);

    if (Object.keys(dados).length === 0) {
      ignorados++;
      continue;
    }

    const placeholder = gerarPlaceholder(linha);
    const programaTexto = normalizarTexto(dados.programa_ingresso);
    const programaEncontrado = programaTexto
      ? programas.find((p) => normalizarTexto(p.titulo) === programaTexto)
      : undefined;

    const cpfNorm = dados.cpf ? String(dados.cpf).replace(/\D/g, '') : '';

    try {
      await alunoSvc.criarAluno({
        nome: dados.nome ? String(dados.nome).trim() : placeholder.nome,
        email: dados.email ? String(dados.email).trim() : placeholder.email,
        cpf: cpfNorm || placeholder.cpf,
        senha: dados.senha ? String(dados.senha) : undefined,
        telefone: dados.telefone ? String(dados.telefone) : undefined,
        data_nascimento: normalizarData(dados.data_nascimento),
        cidade_nascimento: dados.cidade_nascimento ? String(dados.cidade_nascimento).trim() : undefined,
        estado_nascimento: dados.estado_nascimento ? String(dados.estado_nascimento).trim().toUpperCase() : undefined,
        programa_ingresso: dados.programa_ingresso ? String(dados.programa_ingresso).trim() : undefined,
        data_ingresso: normalizarData(dados.data_ingresso),
        escolaridade: dados.escolaridade ? String(dados.escolaridade).trim() : undefined,
        status_profissional: dados.status_profissional ? String(dados.status_profissional).trim() : undefined,
        observacoes: dados.observacoes ? String(dados.observacoes).trim() : undefined,
        estagio_jornada: normalizarEstagio(dados.estagio_jornada),
        id_programa: programaEncontrado?.id_programa,
      });
      importados++;
    } catch (err: any) {
      conflitos.push({
        linha,
        cpf: cpfNorm || placeholder.cpf,
        motivo: err?.message ?? 'Erro desconhecido',
      });
    }
  }

  return { importados, ignorados, conflitos };
}
