import * as fs from 'fs/promises';
import path from 'path';
import { Aluno } from '../database/models/aluno.model';
import { AlunoRepository } from '../repositories/aluno.repository';

const FORMATOS_FOTO_PERMITIDOS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const TAMANHO_MAXIMO_FOTO_BYTES = 2 * 1024 * 1024;
const DIRETORIO_UPLOAD_FOTOS = path.resolve(process.cwd(), 'view', 'aluno', 'uploads');

function extrairPartesDaDataUrl(valor: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(valor);

  if (!match) return null;

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function calcularBytesBase64(base64: string): number {
  const padding = base64.match(/=*$/)?.[0].length ?? 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export class AlunoService {
  constructor(private readonly alunoRepository: AlunoRepository) {}

  async buscarPorRA(ra: number): Promise<Aluno | null> {
    return this.alunoRepository.buscarPorRA(ra);
  }

  async atualizar(ra: number, dados: Partial<Aluno>): Promise<void> {
    const aluno = await this.alunoRepository.buscarPorRA(ra);

    if (!aluno) {
      throw new Error('Aluno nao encontrado.');
    }

    const dadosNormalizados = { ...dados };

    if (typeof dados.foto === 'string' && dados.foto.trim()) {
      dadosNormalizados.foto = await this.processarFoto(ra, dados.foto, aluno.foto);
    }

    await this.alunoRepository.atualizar(ra, dadosNormalizados);
  }

  private async processarFoto(ra: number, foto: string, fotoAnterior?: string): Promise<string> {
    const partes = extrairPartesDaDataUrl(foto);

    if (!partes) {
      throw new Error('Formato de foto invalido. Envie PNG, JPG ou WEBP.');
    }

    const extensao = FORMATOS_FOTO_PERMITIDOS.get(partes.mimeType);

    if (!extensao) {
      throw new Error('Formato de foto invalido. Envie PNG, JPG ou WEBP.');
    }

    if (calcularBytesBase64(partes.base64) > TAMANHO_MAXIMO_FOTO_BYTES) {
      throw new Error('A foto excede o tamanho maximo de 2 MB.');
    }

    const nomeArquivo = `${ra}-${Date.now()}.${extensao}`;
    const caminhoArquivo = path.join(DIRETORIO_UPLOAD_FOTOS, nomeArquivo);
    const caminhoPublico = `/aluno/uploads/${nomeArquivo}`;
    const buffer = Buffer.from(partes.base64, 'base64');

    await fs.mkdir(DIRETORIO_UPLOAD_FOTOS, { recursive: true });
    await fs.writeFile(caminhoArquivo, buffer);

    if (fotoAnterior?.startsWith('/aluno/uploads/')) {
      const nomeAnterior = path.basename(fotoAnterior);
      const caminhoAnterior = path.join(DIRETORIO_UPLOAD_FOTOS, nomeAnterior);

      if (caminhoAnterior !== caminhoArquivo) {
        await fs.unlink(caminhoAnterior).catch(() => undefined);
      }
    }

    return caminhoPublico;
  }
}
