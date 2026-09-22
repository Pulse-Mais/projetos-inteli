import { supabase } from '../../db/supabaseClient';
import * as usuarioSvc from '../../services/usuarioService';
import * as repo from '../../repositories/usuarioRepository';
import { ConflictError } from '../../errors/AppError';

jest.setTimeout(20000);

let isReachable = false;

beforeAll(async () => {
  try {
    const { error } = await supabase.from('usuario').select('id_usuario').limit(1);
    isReachable = !error;
  } catch {
    isReachable = false;
  }
});

describe('Integração — Alunos / Usuário (RN01)', () => {
  it('RN01 — criar usuário com CPF duplicado deve resultar em ConflictError', async () => {
    if (!isReachable) {
      console.warn('[aluno.integration] Supabase inalcançável — teste pulado');
      return;
    }

    const cpf = `99999999${Date.now().toString().slice(-3)}`;
    const userData = {
      nome: 'Teste Integracao',
      email: `teste-integ-${Date.now()}@exemplo.com`,
      senha: 'senha123',
      cpf,
    };

    const created = await repo.create(userData);
    expect(created).toBeDefined();

    try {
      await expect(
        usuarioSvc.criarUsuario({
          nome: 'Outro',
          email: `outra-${Date.now()}@ex.com`,
          senha: 'x',
          cpf,
        }),
      ).rejects.toThrow(ConflictError);
    } finally {
      const found = await repo.findByCpf(cpf);
      if (found) await repo.remove(found.id_usuario);
    }
  });
});
