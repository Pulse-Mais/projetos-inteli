import * as repo from '../repositories/ensinoSuperiorRepository';
import * as jovemRepo from '../repositories/jovemRepository';
import { EnsinoSuperior } from '../models/ensinoSuperior';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { SituacaoEnsinoSuperior } from '../models/enums';

const SITUACOES: SituacaoEnsinoSuperior[] = ['Concluido', 'Cursando', 'Não possui'];

export async function obterHistorico(id_jovem: number): Promise<EnsinoSuperior[]> {
  return repo.buscarPorJovem(id_jovem);
}

export async function criarRegistro(
  id_jovem: number,
  dados: {
    situacao: SituacaoEnsinoSuperior;
    instituicao?: string;
  }
): Promise<EnsinoSuperior> {
  validar(dados);

  // RN14 — só é possível registrar acesso ao ensino superior se o jovem já
  // estiver classificado como "Transformado".
  const jovem = await jovemRepo.buscarPorId(id_jovem);
  if (!jovem) throw new NotFoundError('jovem');
  if (jovem.categoria_atual !== 'Transformado') {
    throw new ValidationError(
      "RN14: só é possível registrar ensino superior para jovem classificado como 'Transformado'"
    );
  }

  // "ingressou" é derivado do status: quem concluiu ou está cursando ingressou.
  const ingressou = dados.situacao !== 'Não possui';

  return repo.inserir({
    id_jovem,
    ingressou,
    situacao: dados.situacao,
    // instituição só faz sentido para quem ingressou.
    instituicao: ingressou ? (dados.instituicao ?? null) : null,
  });
}

export function validar(dados: {
  situacao: SituacaoEnsinoSuperior;
  instituicao?: string;
}): void {
  // RN14 — status de ensino superior deve ser um dos valores válidos.
  if (!dados.situacao || !SITUACOES.includes(dados.situacao)) {
    throw new ValidationError(`situacao inválida: use ${SITUACOES.join(', ')}`);
  }
  // "Não possui" não admite instituição.
  if (dados.situacao === 'Não possui' && dados.instituicao) {
    throw new ValidationError("instituicao não pode ser informada quando situacao é 'Não possui'");
  }
}
