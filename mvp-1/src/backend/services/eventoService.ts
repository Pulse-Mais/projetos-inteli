import * as repo from '../repositories/eventoRepository';
import { CreateEventoData } from '../repositories/eventoRepository';
import { NotFoundError } from '../errors/AppError';
import * as emailSvc from './emailService';
import { findAllComUsuario } from '../repositories/alunoRepository';

/** Lista todos os eventos sem filtro. */
export async function listarEventos() {
  return repo.findAll();
}

/**
 * Busca um evento pelo ID.
 * @throws {NotFoundError} se não encontrado
 */
export async function buscarEvento(id: number) {
  const evento = await repo.findById(id);
  if (!evento) throw new NotFoundError(`Evento com id ${id} nao encontrado`);
  return evento;
}

/**
 * Cria um novo evento e notifica todos os alunos ativos por e-mail (RF007).
 * Falhas no envio de e-mail são capturadas e logadas sem interromper a resposta.
 */
export async function criarEvento(data: CreateEventoData) {
  const evento = await repo.create(data);

  // RF007: notificar todos os alunos ativos sobre o novo evento
  try {
    const alunos = await findAllComUsuario({ ativo: true });
    const emails = alunos
      .filter(a => a.usuario?.email)
      .map(a => a.usuario.email);

    if (emails.length > 0) {
      const dataStr = new Date(evento.data).toLocaleString('pt-BR');
      const assunto = 'Novo evento: ' + evento.nome;
      const corpo = 'Ola!\n\nNovo evento na Pulse Mais:\n\n'
        + 'Nome: ' + evento.nome + '\n'
        + 'Local: ' + evento.local + '\n'
        + 'Data: ' + dataStr + '\n\nAte la!';
      await emailSvc.enviarEmail(emails, assunto, corpo);
    }
  } catch (emailErr) {
    console.warn('[eventoService] Falha ao enviar notificacao:', emailErr);
  }

  return evento;
}

/**
 * Atualiza um evento existente.
 * @throws {NotFoundError} se não encontrado
 */
export async function atualizarEvento(id: number, data: Parameters<typeof repo.update>[1]) {
  const evento = await repo.update(id, data);
  if (!evento) throw new NotFoundError(`Evento com id ${id} nao encontrado`);
  return evento;
}

/**
 * Remove um evento.
 * @throws {NotFoundError} se não encontrado
 */
export async function deletarEvento(id: number) {
  const removido = await repo.remove(id);
  if (!removido) throw new NotFoundError(`Evento com id ${id} nao encontrado`);
}
