import { GestorRepository } from '../repositories/gestor.repository';
import {
  AlunoDetalhadoGestor,
  AlunoGestor,
  ArquivoImportacaoCsv,
  ComunicadoGestor,
  ComunicadoHistorico,
  FiltrosAluno,
  Gestor,
  ResultadoImportacaoCsv,
} from '../database/models/gestor.model';

export class GestorService {
  constructor(private readonly gestorRepository: GestorRepository) {}

  async buscarPorRm(rm: number): Promise<Gestor | null> {
    return this.gestorRepository.buscarPorRm(rm);
  }

  async listarAlunos(rm: number): Promise<AlunoGestor[]> {
    return this.gestorRepository.listarAlunos(rm);
  }

  async buscarAlunoPorRa(rm: number, ra: number): Promise<AlunoDetalhadoGestor | null> {
    return this.gestorRepository.buscarAlunoPorRa(rm, ra);
  }

  async filtrarAlunos(rm: number, filtros: FiltrosAluno): Promise<AlunoGestor[]> {
    return this.gestorRepository.filtrarAlunos(rm, filtros);
  }

  async listarComunicados(): Promise<ComunicadoHistorico[]> {
    return this.gestorRepository.listarComunicados();
  }

  async enviarComunicado(comunicado: ComunicadoGestor): Promise<ComunicadoHistorico | null> {
    return this.gestorRepository.enviarComunicado(comunicado);
  }

  async excluirComunicado(idComunicado: number): Promise<boolean> {
    return this.gestorRepository.excluirComunicado(idComunicado);
  }

  async importarHistoricoCsv(arquivo: ArquivoImportacaoCsv): Promise<ResultadoImportacaoCsv> {
    return this.gestorRepository.importarHistoricoCsv(arquivo);
  }

  async cadastrarAluno(dados: {
    ra: number;
    nome: string;
    cpf: string;
    email_primario: string;
    tel_primario?: string;
    genero?: string;
    data_nasc?: string;
    data_ingresso?: string;
    categoria?: string;
  }): Promise<number> {
    return this.gestorRepository.cadastrarAluno(dados);
  }
}; 
