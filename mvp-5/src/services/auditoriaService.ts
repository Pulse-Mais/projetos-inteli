// Importações e configurações iniciais de dependências
import * as historicoRepo from '../repositories/historicoAcoesRepository';
import type { RegistrarAcaoInput } from '../models/historicoAcoes';

// Função que atua como serviço de mensagem para o sistema de auditoria
export function registrar(params: RegistrarAcaoInput): void {
  historicoRepo
    .inserir({
      id_usuario: params.id_usuario,
      id_jovem_afetado: params.id_jovem_afetado ?? null,
      acao: params.acao,
      tabela_afetada: params.tabela_afetada,
      valor_anterior: params.valor_anterior ?? null,
    })
    .catch((err: unknown) => {
      console.error('[auditoriaService] falha ao registrar ação:', err);
    });
}