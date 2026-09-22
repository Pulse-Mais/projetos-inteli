// Importações e configurações iniciais de dependências
import * as registroRepo from '../repositories/registroAcompanhamentoRepository';
import * as usuarioRepo from '../repositories/usuarioRepository';
import { validarPerfil } from '../helpers/validarPerfil';
import { registrar as registrarAuditoria } from './auditoriaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/AppError';
import type {
  RegistroAcompanhamento,
  CriarRegistroInput,
  AtualizarRegistroInput,
} from '../models/registroAcompanhamento';
import type { PerfilUsuario } from '../models/enums';

// Definição de constantes
const PERFIS_LEITURA: PerfilUsuario[] = ['Gestao', 'Coordenacao', 'Psicologo', 'Mentor'];
const PERFIS_ESCRITA: PerfilUsuario[] = ['Gestao', 'Coordenacao', 'Psicologo', 'Mentor'];

// Função que aplica as regras de negócio
export async function verificarAcesso(
  idRegistro: number,
  idUsuario: number
): Promise<RegistroAcompanhamento> {
  await validarPerfil(idUsuario, PERFIS_LEITURA);

  const registro = await registroRepo.buscarPorId(idRegistro);
  if (!registro) throw new NotFoundError('registro de acompanhamento');

  const usuario = await usuarioRepo.buscarPorId(idUsuario);
  if (!usuario) throw new NotFoundError('usuário');

  if (registro.visibilidade === 'Restrito_Psicologia' && usuario.perfil !== 'Psicologo') {
    throw new ForbiddenError('acesso negado: registro restrito ao perfil Psicólogo');
  }

  return registro;
}

// Função que coordena a listagem do histórico de acompanhamentos de um jovem específico
export async function listar(
  idJovem: number,
  idUsuario: number
): Promise<RegistroAcompanhamento[]> {
  await validarPerfil(idUsuario, PERFIS_LEITURA);

  const usuario = await usuarioRepo.buscarPorId(idUsuario);
  if (!usuario) throw new NotFoundError('usuário');

  return registroRepo.listarPorJovem(idJovem, usuario.perfil !== 'Psicologo');
}

// Função que gerencia o fluxo para a inserção de um novo acompanhamento
export async function criar(
  idJovem: number,
  idUsuario: number,
  input: CriarRegistroInput
): Promise<RegistroAcompanhamento> {
  await validarPerfil(idUsuario, PERFIS_ESCRITA);

  if (!input.conteudo || input.conteudo.trim().length === 0) {
    throw new BadRequestError('conteúdo do registro não pode ser vazio');
  }

  let inputFinal: CriarRegistroInput = { ...input, id_autor: idUsuario };

  if (inputFinal.tipo_registro === 'Acompanhamento_Psicologico') {
    inputFinal = { ...inputFinal, visibilidade: 'Restrito_Psicologia' };
  } else if (!inputFinal.visibilidade) {
    inputFinal = { ...inputFinal, visibilidade: 'Publico_Equipe' };
  }

  const registro = await registroRepo.criar(idJovem, inputFinal);

  registrarAuditoria({
    id_usuario: idUsuario,
    id_jovem_afetado: idJovem,
    acao: `criou registro tipo=${inputFinal.tipo_registro}`,
    tabela_afetada: 'registro_acompanhamento',
  });

  return registro;
}

// Função que executa a lógica de negócio para a atualização de registros existentes
export async function atualizar(
  idRegistro: number,
  idUsuario: number,
  input: AtualizarRegistroInput
): Promise<RegistroAcompanhamento> {
  await validarPerfil(idUsuario, PERFIS_ESCRITA);

  const registroAtual = await registroRepo.buscarPorId(idRegistro);
  if (!registroAtual) throw new NotFoundError('registro de acompanhamento');

  const tipoFinal = input.tipo_registro ?? registroAtual.tipo_registro;
  const inputFinal: AtualizarRegistroInput =
    tipoFinal === 'Acompanhamento_Psicologico'
      ? { ...input, visibilidade: 'Restrito_Psicologia' }
      : input;

  const atualizado = await registroRepo.atualizar(idRegistro, inputFinal);
  if (!atualizado) throw new NotFoundError('registro de acompanhamento');

  // Auditoria assíncrona — sem await
  registrarAuditoria({
    id_usuario: idUsuario,
    id_jovem_afetado: atualizado.id_jovem,
    acao: `atualizou registro id=${idRegistro}`,
    tabela_afetada: 'registro_acompanhamento',
    valor_anterior: JSON.stringify({
      tipo_registro: registroAtual.tipo_registro,
      visibilidade: registroAtual.visibilidade,
      conteudo: registroAtual.conteudo,
    }),
  });

  return atualizado;
}