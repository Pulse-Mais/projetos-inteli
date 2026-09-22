import { AtualizarAnotacao, NovaAnotacao } from '../database/models/anotacao.model';
import { AnotacaoRepository } from '../repositories/anotacao.repository';

export class AnotacaoService {
  constructor(private readonly repository: AnotacaoRepository) {}

  async listarPorAluno(ra: number) {
    this.validarId(ra, 'RA');
    await this.validarAluno(ra);
    return this.repository.listarPorAluno(ra);
  }

  async criar(ra: number, dados: NovaAnotacao) {
    this.validarId(ra, 'RA');
    this.validarTexto(dados.nome_autor, 'nome_autor');
    this.validarTexto(dados.conteudo, 'conteudo');
    this.validarData(dados.data);
    await this.validarAluno(ra);
    return this.repository.criar(ra, dados);
  }

  async atualizar(id: number, dados: AtualizarAnotacao) {
    this.validarId(id, 'id_anotacoes');

    if (Object.keys(dados).length === 0) {
      this.erro('Informe ao menos um campo para atualizar.', 400);
    }

    if (dados.nome_autor !== undefined) this.validarTexto(dados.nome_autor, 'nome_autor');
    if (dados.conteudo !== undefined) this.validarTexto(dados.conteudo, 'conteudo');
    this.validarData(dados.data);

    const anotacao = await this.repository.atualizar(id, dados);
    if (!anotacao) this.erro('Anotacao nao encontrada.', 404);
    return anotacao;
  }

  async remover(id: number) {
    this.validarId(id, 'id_anotacoes');
    const removida = await this.repository.remover(id);
    if (!removida) this.erro('Anotacao nao encontrada.', 404);
  }

  private async validarAluno(ra: number): Promise<void> {
    if (!(await this.repository.alunoExiste(ra))) {
      this.erro('Aluno nao encontrado.', 404);
    }
  }

  private validarId(valor: number, campo: string): void {
    if (!Number.isInteger(valor) || valor <= 0) this.erro(`${campo} invalido.`, 400);
  }

  private validarTexto(valor: unknown, campo: string): void {
    if (typeof valor !== 'string' || valor.trim().length === 0) {
      this.erro(`${campo} invalido.`, 400);
    }
  }

  private validarData(valor?: string): void {
    if (valor !== undefined && Number.isNaN(Date.parse(valor))) {
      this.erro('data invalida.', 400);
    }
  }

  private erro(message: string, status: number): never {
    const erro = new Error(message) as Error & { status: number };
    erro.status = status;
    throw erro;
  }
}
