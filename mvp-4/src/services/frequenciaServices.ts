import FrequenciaRepository from '../repositories/frequenciaRepositories';

class FrequenciaService {
  async registrarAula(ra: number, id_aula: number, data: string, frequencia: boolean, id_coordenador: number) {
    return await FrequenciaRepository.registrarFrequenciaAula(ra, id_aula, data, frequencia, id_coordenador);
  }

  async getFrequenciaAulas(ra: number) {
    return await FrequenciaRepository.getFrequenciaAulas(ra);
  }

  async registrarEvento(ra: number, id_evento: number, data: string, frequencia: boolean, id_coordenador: number) {
    return await FrequenciaRepository.registrarFrequenciaEvento(ra, id_evento, data, frequencia, id_coordenador);
  }

  async getFrequenciaTurma(id_turma: number) {
    return await FrequenciaRepository.getFrequenciaTurma(id_turma);
  }
}

export default new FrequenciaService();
