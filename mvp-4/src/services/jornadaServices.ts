import JornadaRepository from '../repositories/jornadaRepositories';

const LIMITE_FREQUENCIA_PERCENTUAL = 95;
const MENSAGEM_ALERTA_FREQUENCIA =
  'Sua frequencia esta abaixo do limite esperado. Procure a equipe pedagogica para regularizar sua situacao.';

// interface para o alerta do aluno, para o endpoint do RF12
interface AlertaAluno {
  id_alerta: number;
  tipo: string;
  status: string;
  descricao: string;
  data_alerta: string;
}

interface AlertasAlunoDados {
  frequencia_percentual: number;
  alertas: AlertaAluno[];
}

class JornadaService {
  async getJornada(ra: number) {
    return await JornadaRepository.findJornada(ra);
  }

  async getAluno(ra: number) {
    return await JornadaRepository.findAluno(ra);
  }

  async getCertificados(ra: number) {
    return await JornadaRepository.findCertificados(ra);
  }

  // método para o endpoint do RF12
  async getAlertas(ra: number) {
    const repository = JornadaRepository as typeof JornadaRepository & {
      findAlertas(ra: number): Promise<AlertasAlunoDados>;
    };

    const dados = await repository.findAlertas(ra);
    const frequenciaPercentual = Number(dados.frequencia_percentual);
    const alertasAtivos = dados.alertas.filter((alerta) => (
      alerta.tipo === 'frequencia' && alerta.status === 'ativo'
    ));
    const exibirBanner =
      frequenciaPercentual < LIMITE_FREQUENCIA_PERCENTUAL || alertasAtivos.length > 0;

    return {
      frequencia_percentual: frequenciaPercentual,
      limite_frequencia_percentual: LIMITE_FREQUENCIA_PERCENTUAL,
      exibir_banner: exibirBanner,
      mensagem: exibirBanner ? MENSAGEM_ALERTA_FREQUENCIA : null,
      alertas: alertasAtivos,
    };
  }
}

export default new JornadaService();
