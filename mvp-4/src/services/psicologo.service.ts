import { PsicologoRepository } from '../repositories/psicologo.repository';
import { AlunoAtendido, Psicologo, Prontuario, RegistrarProntuario, AtualizarProntuario, FiltrosAlunosAtendidos } from '../database/models/psicologo.model';

export class PsicologoService {
  constructor(private readonly psicologoRepository: PsicologoRepository) { }

  async buscarRmPsi(rm: number): Promise<Psicologo | null> {
    return this.psicologoRepository.buscarRmPsi(rm);
  }

  async buscarAlunosPorRm(rm: number, filtros: FiltrosAlunosAtendidos = {}): Promise<AlunoAtendido[]> {
    return this.psicologoRepository.buscarAlunosPorRm(rm, filtros);
  }

  async registrarProntuario(
    rm: number,
    ra: number,
    dados: RegistrarProntuario,
  ): Promise<void> {
    await this.psicologoRepository.registrarProntuario(rm, ra, dados);
  }

  async buscarProntuarios(rm: number, ra: number): Promise<Prontuario[]> {
    return this.psicologoRepository.buscarProntuarios(rm, ra);
  }

  async atualizarProntuario(
    rm: number,
    ra: number,
    idRelatorio: number,
    dados: AtualizarProntuario,
  ): Promise<boolean> {
    return this.psicologoRepository.atualizarProntuario(rm, ra, idRelatorio, dados);
  }

  async atualizarStatusAtendimento(
    rm: number,
    ra: number,
    status: boolean,
  ): Promise<AlunoAtendido | null> {
    return this.psicologoRepository.atualizarStatusAtendimento(rm, ra, status);
  }
}
