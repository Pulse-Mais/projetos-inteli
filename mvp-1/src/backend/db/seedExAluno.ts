/*
 * Seed — cria/atualiza o ex-aluno de demonstração do Fluxo Principal 3 (Rafael).
 *
 * Idempotente: pode ser executado várias vezes. Cria o `usuario` e o `aluno`
 * (ativo = false → egresso) e preenche os campos do Portal.
 *
 * Pré-requisito: a migration 002_aluno_portal_exaluno.sql já deve ter sido
 * aplicada no banco (senão as colunas do Portal não existem ainda).
 *
 * Uso:  npx tsx src/db/seedExAluno.ts
 */
import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';

const EMAIL = 'exaluno@pulsemais.org';
const CPF = '00017000017';

async function main() {
  // 1) usuario (cria se não existir)
  let { data: usuario } = await supabase
    .from('usuario')
    .select('id_usuario')
    .eq('email', EMAIL)
    .single();

  if (!usuario) {
    const senha = await bcrypt.hash('pulse-mais-2024', 10);
    const { data, error } = await supabase
      .from('usuario')
      .insert({ nome: 'Rafael Toda', email: EMAIL, cpf: CPF, senha })
      .select('id_usuario')
      .single();
    if (error) throw error;
    usuario = data;
    console.log('usuario criado:', usuario.id_usuario);
  } else {
    console.log('usuario já existe:', usuario.id_usuario);
  }

  const id = usuario.id_usuario;

  // 2) aluno (ex-aluno = ativo false). Cria se não existir.
  const { data: alunoExistente } = await supabase
    .from('aluno')
    .select('id_usuario')
    .eq('id_usuario', id)
    .single();

  if (!alunoExistente) {
    const { error } = await supabase
      .from('aluno')
      .insert({ id_usuario: id, ativo: false, id_mentor: null });
    if (error) throw error;
    console.log('aluno criado (ativo=false)');
  }

  // 3) campos do Portal (exigem a migration 002 aplicada)
  const { error: upErr } = await supabase
    .from('aluno')
    .update({
      telefone: '(11) 97766-5544',
      empresa_atual: 'LogiStart Tecnologia',
      cargo_atual: 'Desenvolvedor Júnior',
      area_interesse: 'Desenvolvimento Web',
      disponibilidade_mentoria: false,
      data_formatura: '2024-11-30',
    })
    .eq('id_usuario', id);

  if (upErr) {
    console.error(
      '\n⚠️  Não foi possível gravar os campos do Portal. ' +
        'Aplique antes a migration src/db/migrations/002_aluno_portal_exaluno.sql.\n' +
        'Detalhe: ' + upErr.message,
    );
  } else {
    console.log('campos do Portal preenchidos.');
  }

  console.log(`\n✅ Ex-aluno pronto. id_usuario = ${id}  (use este id no login).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
