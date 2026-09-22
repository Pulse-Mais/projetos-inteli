import TurmasRepository from '../repositories/turmasRepositories';
import { DadosTurma } from '../database/models/turma.model';

class TurmasService {
  async listar(page: number, limit: number) {
    return await TurmasRepository.findAll(page, limit);
  }

  async buscarPorId(id: number) {
    return await TurmasRepository.findById(id);
  }

  async criar(dados: DadosTurma) {
    return await TurmasRepository.create(dados);
  }

  async atualizar(id: number, dados: DadosTurma) {
    return await TurmasRepository.update(id, dados);
  }

  async associarAluno(id_turma: number, ra: number) {
    return await TurmasRepository.associarAluno(id_turma, ra);
  }
}

export default new TurmasService();
