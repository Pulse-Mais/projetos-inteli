import { supabase } from "../db/supabaseClient";

export interface Aluno {
  id_usuario: number;
  ativo: boolean;
  telefone?: string;
  data_nascimento?: string;
  cidade_nascimento?: string;
  estado_nascimento?: string;
  programa_ingresso?: string;
  data_ingresso?: string;
  escolaridade?: string;
  status_profissional?: string;
  observacoes?: string;
  estagio_jornada?: 'conectado' | 'capacitado' | 'transformado' | 'mentor';
  // Campos do Portal do Ex-Aluno (RF005 / Fluxo Principal 3)
  empresa_atual?: string | null;
  cargo_atual?: string | null;
  area_interesse?: string | null;
  disponibilidade_mentoria?: boolean | null;
  data_formatura?: string | null;
}

// Campos do Portal que o próprio aluno/ex-aluno pode editar na tabela `aluno`.
// `data_formatura` NÃO entra aqui: é dado institucional (somente leitura — RN09).
export interface UpdateAlunoPortalData {
  telefone?: string;
  status_profissional?: string;
  empresa_atual?: string | null;
  cargo_atual?: string | null;
  area_interesse?: string | null;
  disponibilidade_mentoria?: boolean | null;
}

export interface CreateAlunoData {
  id_usuario: number;
  telefone?: string;
  data_nascimento?: string;
  cidade_nascimento?: string;
  estado_nascimento?: string;
  programa_ingresso?: string;
  data_ingresso?: string;
  escolaridade?: string;
  status_profissional?: string;
  observacoes?: string;
  foto_url?: string;
  estagio_jornada?: string;
}

export interface AlunoComUsuario extends Aluno {
  usuario: {
    nome: string;
    email: string;
    cpf: string;
    foto_url?: string;
  };
}

export interface AlunoFiltros {
  nome?: string;
  cpf?: string;
  email?: string;
  ativo?: boolean;
}

/**
 * SELECT aluno.* JOIN usuario(nome, email, cpf, foto_url) WHERE ativo = ? ORDER BY id_usuario.
 * LEFT JOIN implícito do PostgREST: inclui aluno mesmo que o usuario não corresponda ao filtro
 * (filtragens em campos de `usuario` são ignoradas silenciosamente). Prefira `findAllComUsuario`
 * quando os filtros de nome/cpf/email precisam eliminar linhas da resposta.
 * Se `ativo` não for informado, aplica ativo = true como padrão.
 */
export async function findAll(filtros: AlunoFiltros = {}): Promise<Aluno[]> {
  let query = supabase
    .from("aluno")
    .select("*, usuario(nome, email, cpf, foto_url)")
    .order("id_usuario");

  if (filtros.ativo !== undefined) {
    query = query.eq("ativo", filtros.ativo);
  } else {
    query = query.eq("ativo", true);
  }

  if (filtros.nome) {
    query = query.ilike("usuario.nome", `%${filtros.nome}%`);
  }
  if (filtros.cpf) {
    query = query.eq("usuario.cpf", filtros.cpf);
  }
  if (filtros.email) {
    query = query.ilike("usuario.email", `%${filtros.email}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * SELECT aluno.* JOIN usuario!inner(nome, email, cpf, foto_url) WHERE [filtros] ORDER BY id_usuario.
 * Usa INNER JOIN (!) com `usuario` para que filtros em campos de usuario (nome/cpf/email)
 * eliminem linhas da resposta em vez de virem como null (comportamento de LEFT JOIN).
 * Não aplica filtro de `ativo` por padrão — o chamador deve passar filtros.ativo explicitamente
 * quando necessário (ex: listagem pelo coordenador que pode ver inativos).
 */
export async function findAllComUsuario(
  filtros: AlunoFiltros = {},
): Promise<AlunoComUsuario[]> {
  // !inner = INNER JOIN com usuario; necessário para que filtros em campos de
  // usuario (nome/cpf/email) eliminem linhas, em vez de virem como null.
  let query = supabase
    .from("aluno")
    .select("*, usuario!inner(nome, email, cpf, foto_url)")
    .order("id_usuario");

  // 'ativo' mora na própria tabela aluno: filtro direto.
  if (filtros.ativo !== undefined) {
    query = query.eq("ativo", filtros.ativo);
  }

  // nome / cpf / email moram em usuario: usar notação de relação embebida.
  // ilike para busca parcial case-insensitive; eq para match exato em cpf.
  if (filtros.nome) {
    query = query.ilike("usuario.nome", `%${filtros.nome}%`);
  }
  if (filtros.cpf) {
    query = query.eq("usuario.cpf", filtros.cpf);
  }
  if (filtros.email) {
    query = query.ilike("usuario.email", `%${filtros.email}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AlunoComUsuario[];
}

/**
 * SELECT * FROM aluno WHERE id_usuario = ? AND ativo = true.
 * Retorna null para alunos inativos (egressos). Use `findByIdIncludeInactive`
 * quando for necessário acessar ex-alunos, por exemplo no Portal (RF005).
 */
export async function findById(id: number): Promise<Aluno | null> {
  const { data, error } = await supabase
    .from("aluno")
    .select("*")
    .eq("id_usuario", id)
    .eq("ativo", true)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/**
 * SELECT * FROM aluno WHERE id_usuario = ? (sem filtro de ativo).
 * Permite recuperar egressos (ativo = false), necessário em fluxos como autenticação
 * no Portal do Ex-Aluno e atualização de dados do ex-aluno (RF005).
 */
export async function findByIdIncludeInactive(
  id: number,
): Promise<Aluno | null> {
  const { data, error } = await supabase
    .from("aluno")
    .select("*")
    .eq("id_usuario", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/**
 * SELECT aluno.* JOIN usuario(nome, email, cpf, foto_url) WHERE id_usuario = ?.
 * LEFT JOIN: retorna aluno independentemente de ativo. Retorna null se não encontrado.
 */
export async function findByIdComUsuario(
  id: number,
): Promise<AlunoComUsuario | null> {
  const { data, error } = await supabase
    .from("aluno")
    .select("*, usuario(nome, email, cpf, foto_url)")
    .eq("id_usuario", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/**
 * INSERT INTO aluno (id_usuario, ativo = true).
 * Cria o registro de aluno para um usuário já existente — padrão usado na importação em lote
 * (RF009), onde `usuario` é criado primeiro e `aluno` é associado em seguida.
 */
export async function createForExistingUser(idUsuario: number): Promise<Aluno> {
  const { data: result, error } = await supabase
    .from("aluno")
    .insert({ id_usuario: idUsuario, ativo: true })
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * INSERT INTO aluno com campos opcionais explicitamente filtrados (evita enviar undefined ao banco).
 * Sempre seta ativo = true (RF009: todo aluno criado começa ativo).
 */
export async function create(data: CreateAlunoData): Promise<Aluno> {
  const insert: Record<string, unknown> = {
    id_usuario: data.id_usuario,
    ativo: true,
  };
  if (data.telefone)            insert.telefone            = data.telefone;
  if (data.data_nascimento)     insert.data_nascimento     = data.data_nascimento;
  if (data.cidade_nascimento)   insert.cidade_nascimento   = data.cidade_nascimento;
  if (data.estado_nascimento)   insert.estado_nascimento   = data.estado_nascimento;
  if (data.programa_ingresso)   insert.programa_ingresso   = data.programa_ingresso;
  if (data.data_ingresso)       insert.data_ingresso       = data.data_ingresso;
  if (data.escolaridade)        insert.escolaridade        = data.escolaridade;
  if (data.status_profissional) insert.status_profissional = data.status_profissional;
  if (data.observacoes)         insert.observacoes         = data.observacoes;
  if (data.estagio_jornada)     insert.estagio_jornada     = data.estagio_jornada;

  const { data: result, error } = await supabase
    .from("aluno")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * UPDATE aluno WHERE id_usuario = ? AND ativo = true.
 * O filtro ativo = true impede edição de egressos por esta via.
 * Para atualizar dados de ex-alunos use `updateDadosPortal`.
 */
export async function update(
  id: number,
  data: Partial<Omit<Aluno, "id_usuario">>,
): Promise<Aluno | null> {
  const { data: result, error } = await supabase
    .from("aluno")
    .update(data)
    .eq("id_usuario", id)
    .eq("ativo", true)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return result ?? null;
}

/**
 * UPDATE aluno WHERE id_usuario = ? (sem filtro de ativo).
 * RF005: o Portal do Ex-Aluno permite que egressos (ativo = false) editem os próprios dados.
 * Diferente de `update`, não restringe a registros ativos.
 * Silencia PGRST116 (não encontrado) e PGRST204 (coluna ausente por migration pendente).
 */
export async function updateDadosPortal(
  id: number,
  data: UpdateAlunoPortalData,
): Promise<Aluno | null> {
  const { data: result, error } = await supabase
    .from("aluno")
    .update(data)
    .eq("id_usuario", id)
    .select()
    .single();
  if (error) {
    // PGRST116 = nenhuma linha; PGRST204 = coluna ainda não existe no schema cache
    // (migration 002 ainda não aplicada). Em ambos, não é erro fatal: seguimos
    // sem gravar os campos do Portal, mantendo a atualização dos dados de usuário.
    if (error.code === "PGRST116" || error.code === "PGRST204") return null;
    throw error;
  }
  return result ?? null;
}

/**
 * UPDATE aluno SET ativo = false, estagio_jornada = 'transformado' WHERE id_usuario = ? AND ativo = true.
 * Inativação lógica (soft delete) — nunca exclui o registro fisicamente.
 * Todo ex-aluno é considerado "transformado" na jornada (RN02).
 * Retorna true se o aluno foi inativado, false se já estava inativo ou não existia.
 */
export async function inactivate(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("aluno")
    .update({ ativo: false, estagio_jornada: "transformado" })
    .eq("id_usuario", id)
    .eq("ativo", true)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data !== null;
}

/**
 * DELETE FROM aluno WHERE id_usuario = ?.
 * Exclusão física (hard delete) — usada apenas para corrigir cadastros feitos por
 * engano (RN17). Diferente de `inactivate`, remove o registro permanentemente.
 * As tabelas dependentes (matricula, historico_profissional, acompanha, avaliacao etc.)
 * têm FK com ON DELETE CASCADE e são removidas automaticamente pelo banco.
 * Retorna true se o aluno existia e foi removido.
 */
export async function hardDelete(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from("aluno")
    .delete({ count: "exact" })
    .eq("id_usuario", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// ── Conquistas do Ex-Aluno ──────────────────────────────────────────────────

export interface Conquista {
  titulo: string;
  data: string;
  categoria: string;
  descricao: string;
  arquivo_url?: string | null;
  // Presentes apenas em conquistas que correspondem a uma linha real e excluível
  // (conquista_manual ou historico_profissional). Conquistas derivadas de eventos
  // ou de matrícula concluída não têm uma linha própria para apagar.
  id_conquista?: number;
  id_historico?: number;
}

/**
 * Retorna a lista de conquistas de um aluno combinando quatro fontes em paralelo:
 * 1. SELECT participa_evento JOIN evento(nome, data) WHERE id_aluno = ? → categoria "Evento"
 * 2. SELECT matricula JOIN programa(titulo, fim) WHERE id_aluno = ? AND status_conclusao = 1 → "Certificado"
 * 3. SELECT historico_profissional(cargo, empresa, data_inicio) WHERE id_aluno = ? → "Conquista Profissional"
 * 4. SELECT conquista_manual WHERE id_aluno = ? → categoria cadastrada manualmente pelo coordenador,
 *    com arquivo_url opcional (PDF/imagem do certificado em base64)
 * Verifica existência do aluno antes para retornar null em vez de lista vazia quando não encontrado.
 */
export async function findConquistasById(id: number): Promise<Conquista[] | null> {
  const { data: alunoData, error: alunoError } = await supabase
    .from("aluno")
    .select("id_usuario")
    .eq("id_usuario", id)
    .single();
  if (alunoError && alunoError.code !== "PGRST116") throw alunoError;
  if (!alunoData) return null;

  const [eventosRes, certificadosRes, historicoRes, manuaisRes] = await Promise.all([
    supabase
      .from("participa_evento")
      .select("evento(nome, data)")
      .eq("id_aluno", id),
    supabase
      .from("matricula")
      .select("programa(titulo, fim)")
      .eq("id_aluno", id)
      .eq("status_conclusao", 1),
    supabase
      .from("historico_profissional")
      .select("id_historico, cargo, empresa, data_inicio")
      .eq("id_aluno", id),
    supabase
      .from("conquista_manual")
      .select("id_conquista, titulo, categoria, data, descricao, arquivo_url")
      .eq("id_aluno", id),
  ]);

  if (eventosRes.error) throw eventosRes.error;
  if (certificadosRes.error) throw certificadosRes.error;
  if (historicoRes.error) throw historicoRes.error;
  if (manuaisRes.error) throw manuaisRes.error;

  const conquistas: Conquista[] = [];

  for (const row of (eventosRes.data ?? []) as any[]) {
    const ev = row.evento;
    if (!ev) continue;
    conquistas.push({
      titulo: ev.nome,
      data: ev.data ? String(ev.data).slice(0, 10) : "",
      categoria: "Evento",
      descricao: `Participou do evento ${ev.nome}.`,
    });
  }

  for (const row of (certificadosRes.data ?? []) as any[]) {
    const prog = row.programa;
    if (!prog) continue;
    conquistas.push({
      titulo: `Certificado de Conclusão — ${prog.titulo}`,
      data: prog.fim ? String(prog.fim).slice(0, 10) : "",
      categoria: "Certificado",
      descricao: `Concluiu com sucesso o programa ${prog.titulo} da Pulse Mais.`,
    });
  }

  for (const row of (historicoRes.data ?? []) as any[]) {
    if (!row.cargo && !row.empresa) continue;
    const cargo = row.cargo ?? "Cargo não informado";
    const empresa = row.empresa ?? "Empresa não informada";
    conquistas.push({
      titulo: `${cargo} na ${empresa}`,
      data: row.data_inicio ? String(row.data_inicio).slice(0, 10) : "",
      categoria: "Conquista Profissional",
      descricao: `Iniciou como ${cargo} na ${empresa}.`,
      id_historico: row.id_historico,
    });
  }

  for (const row of (manuaisRes.data ?? []) as any[]) {
    conquistas.push({
      titulo: row.titulo,
      data: row.data ? String(row.data).slice(0, 10) : "",
      categoria: row.categoria || "Certificado",
      descricao: row.descricao || "",
      id_conquista: row.id_conquista,
      arquivo_url: row.arquivo_url ?? null,
    });
  }

  return conquistas;
}

// ── Perfil Consolidado (RF004) ──────────────────────────────────────────────

export interface PerfilAluno {
  id_usuario: number;
  telefone?: string;
  data_nascimento?: string;
  cidade_nascimento?: string;
  estado_nascimento?: string;
  programa_ingresso?: string;
  data_ingresso?: string;
  escolaridade?: string;
  status_profissional?: string;
  observacoes?: string;
  usuario: { nome: string; email: string; cpf: string; foto_url?: string };
  programas: {
    id_programa?: number;
    nome: string;
    status_conclusao?: number;
    inicio?: string | null;
    fim?: string | null;
  }[];
  eventos: { nome: string; data: string }[];
  avaliacoes: { nota: number; indicador: string }[];
  mentorias: { id_mentoria: number; nome_mentor: string }[];
  historico_profissional: {
    cargo: string | null;
    empresa: string | null;
    data_inicio: string;
    data_fim: string | null;
  }[];
}

/**
 * Monta o perfil consolidado do aluno (RF004) em duas etapas:
 *
 * Etapa 1 — busca o registro base:
 *   SELECT aluno.* JOIN usuario(nome, email, cpf, foto_url) WHERE id_usuario = ?
 *   Retorna null se não encontrado ou se ativo = false.
 *
 * Etapa 2 — cinco consultas em paralelo para as relações:
 *   1. SELECT matricula JOIN programa(titulo, inicio, fim) WHERE id_aluno = ?
 *   2. SELECT participa_evento JOIN evento(nome, data) WHERE id_aluno = ?
 *   3. SELECT avaliacao.* WHERE id_aluno = ?
 *   4. SELECT participa_mentoria(id_mentoria) WHERE id_aluno = ? (evita nesting 4 níveis no PostgREST)
 *   5. SELECT historico_profissional(cargo, empresa, data_inicio, data_fim) WHERE id_aluno = ?
 *
 * Etapa 2b — lookup secundário de indicadores (não-fatal):
 *   SELECT indicador(id_indicador, nome) WHERE id_indicador IN (ids das avaliações)
 *   Resolve os nomes dos indicadores para enriquecer o campo `avaliacoes`.
 *
 * Erros individuais nas consultas paralelas não derrubam o endpoint — retornam lista vazia.
 */
export async function findPerfilById(id: number): Promise<PerfilAluno | null> {
  const alunoRes = await supabase
    .from("aluno")
    .select("*, usuario(nome, email, cpf, foto_url)")
    .eq("id_usuario", id)
    .single();

  if (alunoRes.error && alunoRes.error.code !== "PGRST116") throw alunoRes.error;
  if (!alunoRes.data) return null;
  const aluno = alunoRes.data as any;
  if (!aluno.ativo) return null;

  // Consultas de relações em paralelo — erros individuais não derrubam o endpoint
  const [programasRes, eventosRes, avaliacoesRes, mentoriasRes, historicoRes] =
    await Promise.all([
      supabase
        .from("matricula")
        .select("id_programa, status_conclusao, programa(titulo, inicio, fim)")
        .eq("id_aluno", id),
      supabase
        .from("participa_evento")
        .select("evento(nome, data)")
        .eq("id_aluno", id),
      supabase.from("avaliacao").select("*").eq("id_aluno", id),
      // Join simplificado: evita nesting de 4 níveis que causa erro no PostgREST
      supabase
        .from("participa_mentoria")
        .select("id_mentoria")
        .eq("id_aluno", id),
      supabase
        .from("historico_profissional")
        .select("cargo, empresa, data_inicio, data_fim")
        .eq("id_aluno", id),
    ]);

  const programas = (!programasRes.error && programasRes.data)
    ? programasRes.data.map((r: any) => ({
        id_programa: r.id_programa ?? undefined,
        nome: r.programa?.titulo ?? "",
        status_conclusao: r.status_conclusao,
        inicio: r.programa?.inicio ?? null,
        fim: r.programa?.fim ?? null,
      }))
    : [];

  const eventos = (!eventosRes.error && eventosRes.data)
    ? eventosRes.data.map((r: any) => ({
        nome: r.evento?.nome ?? "",
        data: r.evento?.data ?? "",
      }))
    : [];

  // Avaliações com lookup de indicador — lookup é não-fatal
  let avaliacoes: { nota: number; indicador: string }[] = [];
  if (!avaliacoesRes.error && avaliacoesRes.data && avaliacoesRes.data.length > 0) {
    const avaliacoesRaw = avaliacoesRes.data;
    const indicadorIds = Array.from(
      new Set(avaliacoesRaw.map((item: any) => item.id_indicador).filter(Boolean)),
    );

    const indicadoresById: Record<number, string> = {};
    if (indicadorIds.length > 0) {
      const { data: indicadoresData } = await supabase
        .from("indicador")
        .select("id_indicador, nome")
        .in("id_indicador", indicadorIds);
      (indicadoresData ?? []).forEach((item: any) => {
        indicadoresById[item.id_indicador] = item.nome;
      });
    }

    avaliacoes = avaliacoesRaw.map((r: any) => ({
      nota: r.nota ?? r.valor ?? r.nota_avaliacao ?? null,
      indicador: indicadoresById[r.id_indicador] ?? "",
    }));
  }

  // Lookup secundário: mentoria → mentor → nome (não-fatal, mesmo padrão do indicador)
  let mentorias: { id_mentoria: number; nome_mentor: string }[] = [];
  if (!mentoriasRes.error && mentoriasRes.data && mentoriasRes.data.length > 0) {
    const mentoriaIds = mentoriasRes.data.map((r: any) => r.id_mentoria).filter(Boolean);

    const nomesMentorByMentoriaId: Record<number, string> = {};
    if (mentoriaIds.length > 0) {
      const { data: realizaData } = await supabase
        .from("realiza")
        .select("id_mentor, id_mentoria")
        .in("id_mentoria", mentoriaIds);

      if (realizaData && realizaData.length > 0) {
        const mentorIds = Array.from(new Set(realizaData.map((r: any) => r.id_mentor).filter(Boolean)));
        const { data: usuariosData } = await supabase
          .from("usuario")
          .select("id_usuario, nome")
          .in("id_usuario", mentorIds);

        const nomeByMentorId: Record<number, string> = {};
        (usuariosData ?? []).forEach((u: any) => { nomeByMentorId[u.id_usuario] = u.nome; });
        realizaData.forEach((r: any) => {
          nomesMentorByMentoriaId[r.id_mentoria] = nomeByMentorId[r.id_mentor] ?? "";
        });
      }
    }

    mentorias = mentoriasRes.data.map((r: any) => ({
      id_mentoria: r.id_mentoria,
      nome_mentor: nomesMentorByMentoriaId[r.id_mentoria] ?? "",
    }));
  }

  const historico_profissional = (!historicoRes.error && historicoRes.data)
    ? historicoRes.data.map((r: any) => ({
        cargo: r.cargo,
        empresa: r.empresa,
        data_inicio: r.data_inicio,
        data_fim: r.data_fim,
      }))
    : [];

  return {
    id_usuario: aluno.id_usuario,
    telefone: aluno.telefone,
    data_nascimento: aluno.data_nascimento,
    cidade_nascimento: aluno.cidade_nascimento,
    estado_nascimento: aluno.estado_nascimento,
    programa_ingresso: aluno.programa_ingresso,
    data_ingresso: aluno.data_ingresso,
    escolaridade: aluno.escolaridade,
    status_profissional: aluno.status_profissional,
    observacoes: aluno.observacoes,
    usuario: aluno.usuario,
    programas,
    eventos,
    avaliacoes,
    mentorias,
    historico_profissional,
  };
}
