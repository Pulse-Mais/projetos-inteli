import { AlunoCoordenadora, AtualizarFrequencia, ComunicadoCoordenadora, Coordenadora, RegistrarEvento, RegistrarFrequencia, RegistrarObservacao, Relatorio } from '../database/models/coordenadora.model';
import { CoordenadoraRepository } from '../repositories/coordenadora.repository';

interface FiltrosAlunoCoordenadora {
  idade_min?: number;
  idade_max?: number;
  empregabilidade?: string;
  id_turma?: number;
  localizacao?: string;
  eventos_min?: number;
  eventos_max?: number;
  genero?: string;
  status?: string;
}

export class CoordenadoraService {
  constructor(private readonly coordenadoraRepository: CoordenadoraRepository) { }

  async buscarPorRm(rm: number): Promise<Coordenadora | null> {
    return this.coordenadoraRepository.buscarPorRm(rm);
  }

  async listarAlunos(rm: number): Promise<AlunoCoordenadora[]> {
    return this.coordenadoraRepository.listarAlunos(rm);
  }

  async cadastrarAluno(dados: {
    nome: string;
    cpf: string;
    email_primario: string;
    tel_primario?: string;
    genero?: string;
    data_nasc?: string;
    data_ingresso?: string;
    categoria?: string;
  }): Promise<number> {
    return this.coordenadoraRepository.cadastrarAluno(dados);
  }

  async registrarFrequencia(
    rm: number,
    ra: number,
    dados: RegistrarFrequencia,
  ): Promise<void> {
    await this.coordenadoraRepository.registrarFrequencia(rm, ra, dados);
  }

  async atualizarFrequencia(
    rm: number,
    ra: number,
    idAula: number,
    dados: AtualizarFrequencia,
  ): Promise<boolean> {
    return this.coordenadoraRepository.atualizarFrequencia(rm, ra, idAula, dados);
  }

  async registrarObservacao(
    rm: number,
    ra: number,
    observacao: RegistrarObservacao,
  ): Promise<void> {
    await this.coordenadoraRepository.registrarObservacao(rm, ra, observacao);
  };

  async registrarEvento(
    rm: number,
    evento: RegistrarEvento,
  ): Promise<void> {
    await this.coordenadoraRepository.registrarEvento(rm, evento);
  }

  async listarComunicados(rm: number): Promise<ComunicadoCoordenadora[]> {
    return this.coordenadoraRepository.listarComunicados(rm);
  }

  async excluirComunicado(rm: number, idComunicado: number): Promise<boolean> {
    return this.coordenadoraRepository.excluirComunicado(rm, idComunicado);
  }

  async concluirModuloAluno(
    rm: number,
    ra: number,
    modulo: number,
    data: string,
  ): Promise<boolean> {
    return this.coordenadoraRepository.concluirModuloAluno(rm, ra, modulo, data);
  }

  async desfazerConclusaoModuloAluno(
    rm: number,
    ra: number,
    modulo: number,
  ): Promise<boolean> {
    return this.coordenadoraRepository.desfazerConclusaoModuloAluno(rm, ra, modulo);
  }

  async listarRelatorios(rm: number, ra: number): Promise<Relatorio[]> {
    return this.coordenadoraRepository.listarRelatorios(rm, ra);
  }

  async filtrarAlunos(
    rm: number,
    filtros: FiltrosAlunoCoordenadora,
  ): Promise<AlunoCoordenadora[]> {
    return this.coordenadoraRepository.filtrarAlunos(rm, filtros);
  }
}
