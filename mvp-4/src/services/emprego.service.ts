import { NovoEmprego } from '../database/models/emprego.model';
import { EmpregoRepository } from '../repositories/emprego.repository';

export class EmpregoService {
  static async registrarEmprego(
    ra: number,
    dados: NovoEmprego,
  ): Promise<{ message: string; id_emprego: number }> {
    this.validarRa(ra);
    this.validarDadosEmprego(dados);

    const aluno = await EmpregoRepository.buscarAlunoPorRa(ra);

    if (!aluno) {
      const erro: any = new Error('Aluno nao encontrado.');
      erro.status = 404;
      throw erro;
    }

    const empregoAtivo = await EmpregoRepository.buscarEmpregoAtivo(ra);

    if (empregoAtivo) {
      const erro: any = new Error('Aluno ja possui um emprego ativo registrado. Encerre o emprego atual antes de registrar um novo.');
      erro.status = 409;
      erro.empregoAtivo = {
        id_emprego: empregoAtivo.id_emprego,
        empresa: empregoAtivo.empresa,
        cargo: empregoAtivo.cargo,
        data_inicio: empregoAtivo.data_inicio,
      };
      throw erro;
    }

    const novoEmprego = await EmpregoRepository.inserirEmprego(ra, dados);
    await EmpregoRepository.atualizarStatusAluno(ra, 'Empregado');

    return {
      message: 'Emprego registrado com sucesso. Status do aluno atualizado para Empregado.',
      id_emprego: novoEmprego.id_emprego,
    };
  }

  static async encerrarEmprego(
    ra: number,
    id_emprego: number,
    data_encerramento: string,
  ): Promise<{ message: string }> {
    this.validarRa(ra);
    this.validarIdEmprego(id_emprego);
    this.validarData('data_encerramento', data_encerramento);

    const emprego = await EmpregoRepository.buscarEmpregoPorId(ra, id_emprego);

    if (!emprego) {
      const erro: any = new Error('Aluno ou registro de emprego nao encontrado.');
      erro.status = 404;
      throw erro;
    }

    if (new Date(data_encerramento) < new Date(emprego.data_inicio)) {
      const erro: any = new Error('data_encerramento nao pode ser anterior a data_inicio do emprego.');
      erro.status = 422;
      throw erro;
    }

    await EmpregoRepository.encerrarEmprego(ra, id_emprego, data_encerramento);

    return {
      message: 'Emprego encerrado com sucesso. Registro mantido no historico.',
    };
  }

  static async listarEmpregos(ra: number): Promise<{
    ra: number;
    historico_empregos: Array<{
      id_emprego: number;
      empresa: string;
      cargo: string;
      data_inicio: string;
      data_encerramento: string | null;
      data_termino?: string | null;
      faixa_salarial: string;
      ativo: boolean;
    }>;
  }> {
    this.validarRa(ra);

    const aluno = await EmpregoRepository.buscarAlunoPorRa(ra);

    if (!aluno) {
      const erro: any = new Error('Aluno nao encontrado.');
      erro.status = 404;
      throw erro;
    }

    const historico = await EmpregoRepository.listarEmpregosPorRa(ra);

    return {
      ra,
      historico_empregos: historico,
    };
  }

  private static validarRa(ra: number): void {
    if (!Number.isInteger(ra) || ra <= 0) {
      const erro: any = new Error('RA invalido.');
      erro.status = 400;
      throw erro;
    }
  }

  private static validarIdEmprego(id_emprego: number): void {
    if (!Number.isInteger(id_emprego) || id_emprego <= 0) {
      const erro: any = new Error('id_emprego invalido.');
      erro.status = 400;
      throw erro;
    }
  }

  private static validarDadosEmprego(dados: NovoEmprego): void {
    this.validarTexto('empresa', dados.empresa);
    this.validarTexto('cargo', dados.cargo);
    this.validarTexto('faixa_salarial', dados.faixa_salarial);
    this.validarData('data_inicio', dados.data_inicio);
  }

  private static validarTexto(campo: string, valor: string): void {
    if (typeof valor !== 'string' || valor.trim().length === 0) {
      const erro: any = new Error(`${campo} invalido.`);
      erro.status = 400;
      throw erro;
    }
  }

  private static validarData(campo: string, valor: string): void {
    if (typeof valor !== 'string' || valor.trim().length === 0 || Number.isNaN(Date.parse(valor))) {
      const erro: any = new Error(`${campo} invalido.`);
      erro.status = 400;
      throw erro;
    }
  }
}
