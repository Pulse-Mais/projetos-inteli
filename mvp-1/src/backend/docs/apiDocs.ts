/**
 * Documentação HTML da Pulse Mais WebAPI.
 *
 * Este módulo expõe uma única constante `apiDocsHtml` contendo toda a
 * documentação da API renderizada como string HTML estática. O conteúdo é
 * servido pela rota GET /docs (registrada em src/app.ts).
 *
 * Estrutura interna:
 *  - `MODULES` descreve todos os módulos e endpoints da API.
 *  - Helpers (`renderEndpoint`, `renderModule`, etc.) traduzem a estrutura
 *    em HTML.
 *  - `apiDocsHtml` é a string final, pronta para envio.
 *
 * CSS e JS ficam inline na própria string — sem dependências externas.
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Param {
  name: string;
  type: string;
  description?: string;
}

interface ResponseSpec {
  code: string;
  description: string;
  body?: string;
}

interface Endpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  headers?: string[];
  pathParams?: Param[];
  queryParams?: Param[];
  body?: string;
  responses: ResponseSpec[];
  rf?: string;
  notes?: string;
}

interface ApiModule {
  id: string;
  title: string;
  prefix: string;
  endpoints: Endpoint[];
}

// =============================================================================
// MAPEAMENTO DE ENDPOINTS
// =============================================================================

const MODULES: ApiModule[] = [
  {
    id: 'health',
    title: 'Health',
    prefix: '/health',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        summary: 'Verifica se o servidor e o banco estão operacionais.',
        responses: [
          {
            code: '200',
            description: 'Servidor e banco operacionais.',
            body: '{ "status": "ok", "db": "connected", "project": "Pulse Mais G01" }',
          },
          {
            code: '503',
            description: 'Banco indisponível.',
            body: '{ "status": "error", "db": "disconnected" }',
          },
        ],
      },
    ],
  },

  {
    id: 'usuarios',
    title: 'Usuários',
    prefix: '/usuarios',
    endpoints: [
      {
        method: 'GET',
        path: '/usuarios',
        summary: 'Lista todos os usuários cadastrados.',
        responses: [
          {
            code: '200',
            description: 'Lista de usuários.',
            body: 'Array<{ id_usuario, nome, email, cpf, senha }>',
          },
        ],
        rf: 'RF001',
      },
      {
        method: 'GET',
        path: '/usuarios/:id',
        summary: 'Busca usuário por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Usuário encontrado.', body: '{ id_usuario, nome, email, cpf, senha }' },
          { code: '404', description: 'Usuário não encontrado.', body: '{ "error": "..." }' },
        ],
        rf: 'RF001',
      },
      {
        method: 'POST',
        path: '/usuarios',
        summary: 'Cria novo usuário.',
        body: '{ "nome": string, "email": string, "senha": string, "cpf": string }',
        responses: [
          { code: '201', description: 'Usuário criado.', body: 'objeto usuário criado' },
          { code: '409', description: 'CPF ou email já cadastrado.' },
        ],
        rf: 'RF001, RN01',
      },
      {
        method: 'PUT',
        path: '/usuarios/:id',
        summary: 'Atualiza dados do usuário.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { nome, email, senha, cpf }',
        responses: [
          { code: '200', description: 'Usuário atualizado.', body: 'objeto usuário atualizado' },
          { code: '404', description: 'Usuário não encontrado.' },
        ],
        rf: 'RF001',
      },
      {
        method: 'DELETE',
        path: '/usuarios/:id',
        summary: 'Remove usuário fisicamente.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removido (sem corpo).' },
          { code: '404', description: 'Usuário não encontrado.' },
        ],
      },
    ],
  },

  {
    id: 'alunos',
    title: 'Alunos',
    prefix: '/alunos',
    endpoints: [
      {
        method: 'GET',
        path: '/alunos',
        summary: 'Lista alunos com filtros opcionais.',
        queryParams: [
          { name: 'nome', type: 'string', description: 'busca parcial (ilike)' },
          { name: 'cpf', type: 'string', description: 'match exato' },
          { name: 'email', type: 'string', description: 'busca parcial (ilike)' },
          { name: 'ativo', type: 'true | false', description: 'default = true' },
        ],
        responses: [
          {
            code: '200',
            description: 'Lista filtrada de alunos com dados do usuário embebidos.',
            body: 'Array<{ id_usuario, ativo, usuario: { nome, email, cpf } }>',
          },
        ],
        rf: 'RF001, RF009, RN02',
      },
      {
        method: 'GET',
        path: '/alunos/:id',
        summary: 'Busca aluno por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Aluno encontrado.', body: '{ id_usuario, ativo, usuario: { nome, email, cpf } }' },
          { code: '404', description: 'Aluno não encontrado ou inativo.' },
        ],
        rf: 'RF001',
      },
      {
        method: 'GET',
        path: '/alunos/:id/perfil',
        summary: 'Retorna perfil consolidado do aluno (somente-leitura).',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          {
            code: '200',
            description: 'Perfil completo do aluno com vínculos.',
            body: '{ usuario, programas: [...], eventos: [...], avaliacoes: [...], mentorias: [...], historico_profissional: [...] }',
          },
          { code: '404', description: 'Aluno não encontrado ou inativo.' },
        ],
        rf: 'RF004, RN05',
      },
      {
        method: 'POST',
        path: '/alunos',
        summary: 'Cria vínculo de aluno para um usuário já existente.',
        body: '{ "id_usuario": integer }',
        responses: [
          { code: '201', description: 'Vínculo criado.', body: '{ id_usuario, ativo }' },
          { code: '404', description: 'Usuário não encontrado.' },
        ],
        rf: 'RF001',
      },
      {
        method: 'PUT',
        path: '/alunos/:id',
        summary: 'Atualiza dados do aluno (campos da tabela aluno).',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: '{ campos opcionais do aluno }',
        responses: [
          { code: '200', description: 'Aluno atualizado.', body: 'objeto aluno atualizado' },
          { code: '404', description: 'Aluno não encontrado.' },
        ],
        rf: 'RF001',
      },
      {
        method: 'GET',
        path: '/alunos/:id/portal',
        summary: 'Retorna os dados cadastrais do próprio aluno via Portal do Aluno (somente-leitura).',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          {
            code: '200',
            description: 'Dados do aluno (sem o campo senha — RN09).',
            body: '{ id_usuario, id_mentor, ativo, usuario: { nome, email, cpf } }',
          },
          { code: '404', description: 'Aluno não encontrado ou inativo.' },
        ],
        rf: 'RF005, RN07, RN09',
      },
      {
        method: 'PUT',
        path: '/alunos/:id/portal',
        summary: 'Atualiza dados do próprio aluno via Portal do Aluno.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { nome, email, senha, cpf }',
        responses: [
          { code: '200', description: 'Dados do usuário (sem o campo senha).' },
          { code: '400', description: 'ID inválido.' },
          { code: '404', description: 'Aluno não encontrado.' },
        ],
        rf: 'RF005, RN09',
      },
      {
        method: 'DELETE',
        path: '/alunos/:id',
        summary: 'Inativa o aluno (exclusão lógica — ativo = false).',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Inativado (sem corpo).' },
          { code: '404', description: 'Aluno não encontrado.' },
        ],
        rf: 'RF001, RN02',
      },
      {
        method: 'GET',
        path: '/alunos/:id/entregas',
        summary: 'Lista todas as entregas de atividades do aluno.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Lista de entregas.', body: 'Array<{ id_aluno, id_atividade, data_entrega }>' },
          { code: '404', description: 'Aluno não encontrado.' },
        ],
        rf: 'RF003',
      },
      {
        method: 'POST',
        path: '/alunos/:id/entregas',
        summary: 'Registra entrega de atividade para o aluno.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: '{ "id_atividade": integer, "data_entrega": "YYYY-MM-DD" }',
        responses: [
          { code: '201', description: 'Entrega criada.', body: 'objeto entrega criado' },
          { code: '400', description: 'Data futura (RN04) ou aluno não encontrado.' },
        ],
        rf: 'RF003, RN04',
      },
      {
        method: 'PUT',
        path: '/alunos/:id/entregas/:id_atividade',
        summary: 'Atualiza uma entrega de atividade do aluno (data de entrega).',
        pathParams: [
          { name: 'id', type: 'integer', description: 'ID do aluno' },
          { name: 'id_atividade', type: 'integer', description: 'ID da atividade' },
        ],
        body: '{ data_entrega: "YYYY-MM-DD" }',
        responses: [
          { code: '200', description: 'Entrega atualizada.', body: 'objeto entrega atualizado' },
          { code: '400', description: 'Data futura (RN04).' },
          { code: '404', description: 'Aluno ou entrega não encontrada.' },
        ],
        rf: 'RF003, RN04',
      },
      {
        method: 'DELETE',
        path: '/alunos/:id/entregas/:id_atividade',
        summary: 'Remove uma entrega de atividade do aluno.',
        pathParams: [
          { name: 'id', type: 'integer', description: 'ID do aluno' },
          { name: 'id_atividade', type: 'integer', description: 'ID da atividade' },
        ],
        responses: [
          { code: '204', description: 'Removida (sem corpo).' },
          { code: '404', description: 'Aluno ou entrega não encontrada.' },
        ],
        rf: 'RF003',
      },
      {
        method: 'GET',
        path: '/alunos/:id/historico',
        summary: 'Lista histórico profissional do aluno.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Lista do histórico profissional.', body: 'Array<{ id_historico, cargo, empresa, data_inicio, data_fim, id_usuario }>' },
          { code: '404', description: 'Aluno não encontrado ou inativo.' },
        ],
        rf: 'RF010',
      },
      {
        method: 'POST',
        path: '/alunos/:id/historico',
        summary: 'Cria registro no histórico profissional do aluno.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: '{ "cargo": string, "empresa": string, "data_inicio": "YYYY-MM-DD", "data_fim": "YYYY-MM-DD" (opcional) }',
        responses: [
          { code: '201', description: 'Histórico criado.', body: 'objeto histórico criado' },
          { code: '404', description: 'Aluno não encontrado ou inativo.' },
        ],
        rf: 'RF010',
      },
      {
        method: 'PUT',
        path: '/alunos/:id/historico/:id_hist',
        summary: 'Atualiza registro do histórico profissional.',
        pathParams: [
          { name: 'id', type: 'integer', description: 'ID do aluno' },
          { name: 'id_hist', type: 'integer', description: 'ID do histórico' },
        ],
        body: 'Qualquer subconjunto de { cargo, empresa, data_inicio, data_fim }',
        responses: [
          { code: '200', description: 'Histórico atualizado.', body: 'objeto histórico atualizado' },
          { code: '404', description: 'Aluno ou histórico não encontrado.' },
        ],
        rf: 'RF010',
      },
      {
        method: 'DELETE',
        path: '/alunos/:id/historico/:id_hist',
        summary: 'Remove registro do histórico profissional.',
        pathParams: [
          { name: 'id', type: 'integer', description: 'ID do aluno' },
          { name: 'id_hist', type: 'integer', description: 'ID do histórico' },
        ],
        responses: [
          { code: '204', description: 'Removido (sem corpo).' },
          { code: '404', description: 'Aluno ou histórico não encontrado.' },
        ],
        rf: 'RF010',
      },
    ],
  },

  {
    id: 'mentores',
    title: 'Mentores',
    prefix: '/mentores',
    endpoints: [
      {
        method: 'GET',
        path: '/mentores',
        summary: 'Lista todos os mentores.',
        responses: [
          {
            code: '200',
            description: 'Lista de mentores.',
            body: 'Array<{ id_usuario, especialidade, disponibilidade, tipo_vinculo, ativo, usuario: { nome, email, cpf } }>',
          },
        ],
        rf: 'RF011',
      },
      {
        method: 'GET',
        path: '/mentores/:id',
        summary: 'Busca mentor por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Mentor encontrado com dados do usuário.', body: 'objeto mentor com dados do usuário' },
          { code: '404', description: 'Mentor não encontrado.' },
        ],
        rf: 'RF011',
      },
      {
        method: 'GET',
        path: '/mentores/:id/mentorandos',
        summary: 'Lista alunos vinculados ao mentor (via tabela acompanha).',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Lista de mentorandos.', body: 'Array<{ id_usuario, nome, email, id_programa }>' },
        ],
        rf: 'RF013',
      },
      {
        method: 'POST',
        path: '/mentores',
        summary: 'Cria novo mentor (cria usuário + vínculo mentor).',
        body: '{ "nome": string, "email": string, "senha": string, "cpf": string, "especialidade": string, "disponibilidade": string, "tipo_vinculo": string }',
        responses: [
          { code: '201', description: 'Mentor criado.', body: 'objeto mentor criado' },
          { code: '409', description: 'CPF ou email já cadastrado.' },
        ],
        rf: 'RF011',
      },
      {
        method: 'PUT',
        path: '/mentores/:id',
        summary: 'Atualiza dados do mentor.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto dos campos do mentor.',
        responses: [
          { code: '200', description: 'Mentor atualizado.', body: 'objeto mentor atualizado' },
          { code: '404', description: 'Mentor não encontrado.' },
        ],
        rf: 'RF011',
      },
      {
        method: 'DELETE',
        path: '/mentores/:id',
        summary: 'Inativa o mentor (exclusão lógica — ativo = false).',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Inativado (sem corpo).' },
          { code: '404', description: 'Mentor não encontrado.' },
        ],
        rf: 'RF011, RN13',
      },
    ],
  },

  {
    id: 'mentorias',
    title: 'Mentorias',
    prefix: '/mentorias',
    endpoints: [
      {
        method: 'GET',
        path: '/mentorias',
        summary: 'Lista todas as mentorias.',
        responses: [
          { code: '200', description: 'Lista de mentorias.', body: 'Array<{ id_mentoria, formato, tema, duracao, data }>' },
        ],
        rf: 'RF012',
      },
      {
        method: 'GET',
        path: '/mentorias/:id',
        summary: 'Busca mentoria por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Mentoria encontrada.', body: 'objeto mentoria' },
          { code: '404', description: 'Mentoria não encontrada.' },
        ],
        rf: 'RF012',
      },
      {
        method: 'POST',
        path: '/mentorias',
        summary: 'Cria nova mentoria vinculando mentor e aluno.',
        body: '{ "formato": string, "tema": string, "duracao": integer, "data": "YYYY-MM-DDTHH:mm:ssZ", "id_mentor": integer, "id_aluno": integer }',
        responses: [
          { code: '201', description: 'Mentoria criada.', body: 'objeto mentoria criado' },
          { code: '400', description: 'Mentor ou aluno inativos (RN12).' },
          { code: '404', description: 'Mentor ou aluno não encontrados.' },
        ],
        rf: 'RF012, RN12',
      },
      {
        method: 'PUT',
        path: '/mentorias/:id',
        summary: 'Atualiza dados da mentoria.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { formato, tema, duracao, data }',
        responses: [
          { code: '200', description: 'Mentoria atualizada.', body: 'objeto mentoria atualizado' },
          { code: '404', description: 'Mentoria não encontrada.' },
        ],
        rf: 'RF012',
      },
      {
        method: 'DELETE',
        path: '/mentorias/:id',
        summary: 'Remove a mentoria.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removida (sem corpo).' },
          { code: '404', description: 'Mentoria não encontrada.' },
        ],
        rf: 'RF012',
      },
    ],
  },

  {
    id: 'programas',
    title: 'Programas',
    prefix: '/programas',
    endpoints: [
      {
        method: 'GET',
        path: '/programas',
        summary: 'Lista todos os programas.',
        responses: [
          { code: '200', description: 'Lista de programas.', body: 'Array<{ id_programa, titulo, inicio, fim }>' },
        ],
      },
      {
        method: 'GET',
        path: '/programas/:id',
        summary: 'Busca programa por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Programa encontrado.', body: 'objeto programa' },
          { code: '404', description: 'Programa não encontrado.' },
        ],
      },
      {
        method: 'POST',
        path: '/programas',
        summary: 'Cria novo programa.',
        body: '{ "titulo": string, "inicio": "YYYY-MM-DD", "fim": "YYYY-MM-DD" }',
        responses: [
          { code: '201', description: 'Programa criado.', body: 'objeto programa criado' },
        ],
      },
      {
        method: 'PUT',
        path: '/programas/:id',
        summary: 'Atualiza dados do programa.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { titulo, inicio, fim }',
        responses: [
          { code: '200', description: 'Programa atualizado.', body: 'objeto programa atualizado' },
          { code: '404', description: 'Programa não encontrado.' },
        ],
      },
      {
        method: 'DELETE',
        path: '/programas/:id',
        summary: 'Remove o programa.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removido (sem corpo).' },
          { code: '404', description: 'Programa não encontrado.' },
        ],
      },
    ],
  },

  {
    id: 'eventos',
    title: 'Eventos',
    prefix: '/eventos',
    endpoints: [
      {
        method: 'GET',
        path: '/eventos',
        summary: 'Lista todos os eventos.',
        responses: [
          { code: '200', description: 'Lista de eventos.', body: 'Array<{ id_evento, nome, data, local }>' },
        ],
        rf: 'RF007',
      },
      {
        method: 'GET',
        path: '/eventos/:id',
        summary: 'Busca evento por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Evento encontrado.', body: 'objeto evento' },
          { code: '404', description: 'Evento não encontrado.' },
        ],
        rf: 'RF007',
      },
      {
        method: 'POST',
        path: '/eventos',
        summary: 'Cria novo evento e notifica todos os alunos ativos por e-mail (RF007).',
        body: '{ "nome": string, "data": "YYYY-MM-DDTHH:mm:ssZ", "local": string }',
        responses: [
          { code: '201', description: 'Evento criado.', body: 'objeto evento criado' },
        ],
        notes: 'Se SMTP não estiver configurado, o e-mail é logado no console sem interromper a criação.',
        rf: 'RF007',
      },
      {
        method: 'PUT',
        path: '/eventos/:id',
        summary: 'Atualiza dados do evento.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { nome, data, local }',
        responses: [
          { code: '200', description: 'Evento atualizado.', body: 'objeto evento atualizado' },
          { code: '404', description: 'Evento não encontrado.' },
        ],
        rf: 'RF007',
      },
      {
        method: 'DELETE',
        path: '/eventos/:id',
        summary: 'Remove o evento.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removido (sem corpo).' },
          { code: '404', description: 'Evento não encontrado.' },
        ],
        rf: 'RF007',
      },
    ],
  },

  {
    id: 'indicadores',
    title: 'Indicadores',
    prefix: '/indicadores',
    endpoints: [
      {
        method: 'GET',
        path: '/indicadores',
        summary: 'Lista todos os indicadores de avaliação.',
        responses: [
          { code: '200', description: 'Lista de indicadores.', body: 'Array<{ id_indicador, nome, descricao, id_programa }>' },
        ],
        rf: 'RF002',
      },
      {
        method: 'GET',
        path: '/indicadores/:id',
        summary: 'Busca indicador por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Indicador encontrado.', body: 'objeto indicador' },
          { code: '404', description: 'Indicador não encontrado.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'POST',
        path: '/indicadores',
        summary: 'Cria novo indicador vinculado a um programa.',
        body: '{ "nome": string, "descricao": string (opcional), "id_programa": integer }',
        responses: [
          { code: '201', description: 'Indicador criado.', body: 'objeto indicador criado' },
        ],
        rf: 'RF002, RN03',
      },
      {
        method: 'PUT',
        path: '/indicadores/:id',
        summary: 'Atualiza o indicador.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { nome, descricao, id_programa }',
        responses: [
          { code: '200', description: 'Indicador atualizado.', body: 'objeto indicador atualizado' },
          { code: '404', description: 'Indicador não encontrado.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'DELETE',
        path: '/indicadores/:id',
        summary: 'Remove o indicador.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removido (sem corpo).' },
          { code: '404', description: 'Indicador não encontrado.' },
        ],
        rf: 'RF002',
      },
    ],
  },

  {
    id: 'avaliacoes',
    title: 'Avaliações',
    prefix: '/avaliacoes',
    endpoints: [
      {
        method: 'GET',
        path: '/avaliacoes',
        summary: 'Lista todas as avaliações.',
        responses: [
          { code: '200', description: 'Lista de avaliações.', body: 'Array<{ id_avaliacao, nota, data_avaliacao, id_indicador, id_aluno }>' },
        ],
        rf: 'RF002',
      },
      {
        method: 'GET',
        path: '/avaliacoes/:id',
        summary: 'Busca avaliação por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Avaliação encontrada.', body: 'objeto avaliação' },
          { code: '404', description: 'Avaliação não encontrada.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'POST',
        path: '/avaliacoes',
        summary: 'Registra nova avaliação de indicador para um aluno.',
        body: '{ "nota": integer (1-5), "data_avaliacao": "YYYY-MM-DD", "id_indicador": integer, "id_aluno": integer }',
        responses: [
          { code: '201', description: 'Avaliação criada.', body: 'objeto avaliação criado' },
          { code: '400', description: 'Nota fora do intervalo 1-5 (RN10).' },
        ],
        rf: 'RF002, RN03, RN10',
      },
      {
        method: 'PUT',
        path: '/avaliacoes/:id',
        summary: 'Atualiza a avaliação.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { nota, data_avaliacao, id_indicador, id_aluno }',
        responses: [
          { code: '200', description: 'Avaliação atualizada.', body: 'objeto avaliação atualizado' },
          { code: '400', description: 'Nota inválida.' },
          { code: '404', description: 'Avaliação não encontrada.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'DELETE',
        path: '/avaliacoes/:id',
        summary: 'Remove a avaliação.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removida (sem corpo).' },
          { code: '404', description: 'Avaliação não encontrada.' },
        ],
        rf: 'RF002',
      },
    ],
  },

  {
    id: 'atividades',
    title: 'Atividades',
    prefix: '/atividades',
    endpoints: [
      {
        method: 'GET',
        path: '/atividades',
        summary: 'Lista todas as atividades cadastradas.',
        responses: [
          { code: '200', description: 'Lista de atividades.', body: 'Array<{ id_atividade, titulo, status, id_programa }>' },
        ],
        rf: 'RF003',
      },
      {
        method: 'GET',
        path: '/atividades/:id',
        summary: 'Busca atividade por ID.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '200', description: 'Atividade encontrada.', body: 'objeto atividade' },
          { code: '404', description: 'Atividade não encontrada.' },
        ],
        rf: 'RF003',
      },
      {
        method: 'POST',
        path: '/atividades',
        summary: 'Cria nova atividade.',
        body: '{ "titulo": string, "status": string, "id_programa": integer }',
        responses: [
          { code: '201', description: 'Atividade criada.', body: 'objeto atividade criado' },
        ],
        rf: 'RF003',
      },
      {
        method: 'PUT',
        path: '/atividades/:id',
        summary: 'Atualiza atividade.',
        pathParams: [{ name: 'id', type: 'integer' }],
        body: 'Qualquer subconjunto de { titulo, status, id_programa }',
        responses: [
          { code: '200', description: 'Atividade atualizada.', body: 'objeto atividade atualizado' },
          { code: '404', description: 'Atividade não encontrada.' },
        ],
        rf: 'RF003',
      },
      {
        method: 'DELETE',
        path: '/atividades/:id',
        summary: 'Remove a atividade.',
        pathParams: [{ name: 'id', type: 'integer' }],
        responses: [
          { code: '204', description: 'Removida (sem corpo).' },
          { code: '404', description: 'Atividade não encontrada.' },
        ],
        rf: 'RF003',
      },
    ],
  },

  {
    id: 'importacao',
    title: 'Importação',
    prefix: '/importacao',
    endpoints: [
      {
        method: 'POST',
        path: '/importacao/alunos',
        summary: 'Importa alunos a partir de arquivo CSV ou XLSX.',
        headers: ['Content-Type: multipart/form-data'],
        body: 'Form field "arquivo" — arquivo .csv ou .xlsx. Colunas obrigatórias: nome, email, senha, cpf.',
        responses: [
          { code: '200', description: 'Todos os registros importados sem conflito.', body: '{ "importados": integer }' },
          {
            code: '207',
            description: 'Importação parcial — alguns CPFs já existiam.',
            body: '{ "importados": integer, "conflitos": [{ "linha": integer, "cpf": string, "motivo": string }] }',
          },
          { code: '400', description: 'Formato inválido ou colunas ausentes (RN08).' },
        ],
        rf: 'RF006, RN06, RN08',
      },
    ],
  },

  {
    id: 'dashboard',
    title: 'Dashboard',
    prefix: '/dashboard',
    endpoints: [
      {
        method: 'GET',
        path: '/dashboard',
        summary: 'Retorna indicadores agregados de impacto institucional.',
        responses: [
          {
            code: '200',
            description: 'Indicadores agregados.',
            body: '{\n  "total_alunos_ativos": integer,\n  "taxa_empregabilidade": float,\n  "alunos_por_programa": [\n    { "id_programa": integer, "nome_programa": string, "total_alunos": integer }\n  ]\n}',
          },
        ],
        rf: 'RF008',
      },
    ],
  },

  {
    id: 'acompanha',
    title: 'Acompanha',
    prefix: '/acompanha',
    endpoints: [
      {
        method: 'POST',
        path: '/acompanha',
        summary: 'Cria vínculo de acompanhamento entre mentor, aluno e programa.',
        body: '{ "id_mentor": integer, "id_aluno": integer, "id_programa": integer }',
        responses: [
          { code: '201', description: 'Vínculo criado.', body: '{ id_mentor, id_aluno, id_programa }' },
          { code: '409', description: 'Vínculo já existe para este mentor, aluno e programa.' },
        ],
        rf: 'RF013',
      },
    ],
  },

  {
    id: 'matriculas',
    title: 'Matrículas',
    prefix: '/matriculas',
    endpoints: [
      {
        method: 'GET',
        path: '/matriculas',
        summary: 'Lista todas as matrículas.',
        responses: [
          { code: '200', description: 'Lista de matrículas.', body: 'Array<{ id_programa, id_aluno, status_conclusao, data_ingresso }>' },
        ],
      },
      {
        method: 'POST',
        path: '/matriculas',
        summary: 'Cria vínculo de matrícula entre aluno e programa.',
        body: '{ "id_programa": integer, "id_aluno": integer, "status_conclusao"?: integer, "data_ingresso"?: "YYYY-MM-DD" }',
        responses: [
          { code: '201', description: 'Matrícula criada.', body: '{ id_programa, id_aluno, status_conclusao, data_ingresso }' },
          { code: '409', description: 'Matrícula já existente para este par aluno/programa.' },
        ],
      },
      {
        method: 'GET',
        path: '/matriculas/aluno/:id_aluno',
        summary: 'Lista todas as matrículas de um aluno.',
        pathParams: [{ name: 'id_aluno', type: 'integer' }],
        responses: [
          { code: '200', description: 'Matrículas do aluno.', body: 'Array<{ id_programa, id_aluno, status_conclusao, data_ingresso }>' },
        ],
      },
      {
        method: 'GET',
        path: '/matriculas/programa/:id_programa',
        summary: 'Lista todos os alunos matriculados em um programa.',
        pathParams: [{ name: 'id_programa', type: 'integer' }],
        responses: [
          { code: '200', description: 'Matrículas do programa.', body: 'Array<{ id_programa, id_aluno, status_conclusao, data_ingresso }>' },
        ],
      },
      {
        method: 'GET',
        path: '/matriculas/:id_programa/:id_aluno',
        summary: 'Busca matrícula específica por chave composta (programa + aluno).',
        pathParams: [
          { name: 'id_programa', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        responses: [
          { code: '200', description: 'Matrícula encontrada.', body: '{ id_programa, id_aluno, status_conclusao, data_ingresso }' },
          { code: '404', description: 'Matrícula não encontrada.' },
        ],
      },
      {
        method: 'PUT',
        path: '/matriculas/:id_programa/:id_aluno',
        summary: 'Atualiza dados da matrícula (ex.: status de conclusão).',
        pathParams: [
          { name: 'id_programa', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        body: 'Qualquer subconjunto de { status_conclusao, data_ingresso }',
        responses: [
          { code: '200', description: 'Matrícula atualizada.', body: '{ id_programa, id_aluno, status_conclusao, data_ingresso }' },
          { code: '404', description: 'Matrícula não encontrada.' },
        ],
      },
      {
        method: 'DELETE',
        path: '/matriculas/:id_programa/:id_aluno',
        summary: 'Remove vínculo de matrícula.',
        pathParams: [
          { name: 'id_programa', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        responses: [
          { code: '204', description: 'Matrícula removida (sem corpo).' },
          { code: '404', description: 'Matrícula não encontrada.' },
        ],
      },
    ],
  },

  {
    id: 'participacoes-evento',
    title: 'Participações em Evento',
    prefix: '/participacoes-evento',
    endpoints: [
      {
        method: 'GET',
        path: '/participacoes-evento',
        summary: 'Lista todas as participações em eventos.',
        responses: [
          { code: '200', description: 'Lista de participações.', body: 'Array<{ id_evento, id_aluno, presenca }>' },
        ],
        rf: 'RF002',
      },
      {
        method: 'POST',
        path: '/participacoes-evento',
        summary: 'Registra participação de um aluno em um evento.',
        body: '{ "id_evento": integer, "id_aluno": integer, "presenca"?: boolean }',
        responses: [
          { code: '201', description: 'Participação registrada.', body: '{ id_evento, id_aluno, presenca }' },
          { code: '409', description: 'Participação já registrada para este par evento/aluno.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'GET',
        path: '/participacoes-evento/evento/:id_evento',
        summary: 'Lista todos os alunos participantes de um evento.',
        pathParams: [{ name: 'id_evento', type: 'integer' }],
        responses: [
          { code: '200', description: 'Participações do evento.', body: 'Array<{ id_evento, id_aluno, presenca }>' },
        ],
        rf: 'RF002',
      },
      {
        method: 'GET',
        path: '/participacoes-evento/aluno/:id_aluno',
        summary: 'Lista todos os eventos em que um aluno participou.',
        pathParams: [{ name: 'id_aluno', type: 'integer' }],
        responses: [
          { code: '200', description: 'Participações do aluno.', body: 'Array<{ id_evento, id_aluno, presenca }>' },
        ],
        rf: 'RF002',
      },
      {
        method: 'GET',
        path: '/participacoes-evento/:id_evento/:id_aluno',
        summary: 'Busca participação específica por chave composta (evento + aluno).',
        pathParams: [
          { name: 'id_evento', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        responses: [
          { code: '200', description: 'Participação encontrada.', body: '{ id_evento, id_aluno, presenca }' },
          { code: '404', description: 'Participação não encontrada.' },
        ],
        rf: 'RF002',
      },
      {
        method: 'PUT',
        path: '/participacoes-evento/:id_evento/:id_aluno',
        summary: 'Atualiza presença do aluno no evento.',
        pathParams: [
          { name: 'id_evento', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        body: '{ "presenca": boolean }',
        responses: [
          { code: '200', description: 'Presença atualizada.', body: '{ id_evento, id_aluno, presenca }' },
          { code: '404', description: 'Participação não encontrada.' },
        ],
        rf: 'RF002',
        notes: 'Campo `presenca` é obrigatório. Reflete o registro de frequência em evento (RN03).',
      },
      {
        method: 'DELETE',
        path: '/participacoes-evento/:id_evento/:id_aluno',
        summary: 'Remove participação do aluno no evento.',
        pathParams: [
          { name: 'id_evento', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        responses: [
          { code: '204', description: 'Participação removida (sem corpo).' },
          { code: '404', description: 'Participação não encontrada.' },
        ],
      },
    ],
  },

  {
    id: 'gerencias',
    title: 'Gerências',
    prefix: '/gerencias',
    endpoints: [
      {
        method: 'GET',
        path: '/gerencias',
        summary: 'Lista todos os vínculos coordenador–programa.',
        responses: [
          { code: '200', description: 'Lista de gerências.', body: 'Array<{ id_coordenador, id_programa }>' },
        ],
      },
      {
        method: 'POST',
        path: '/gerencias',
        summary: 'Cria vínculo de gerência entre coordenador e programa.',
        body: '{ "id_coordenador": integer, "id_programa": integer }',
        responses: [
          { code: '201', description: 'Vínculo criado.', body: '{ id_coordenador, id_programa }' },
          { code: '409', description: 'Vínculo já existente para este par coordenador/programa.' },
        ],
      },
      {
        method: 'GET',
        path: '/gerencias/programa/:id_programa',
        summary: 'Lista coordenadores responsáveis por um programa.',
        pathParams: [{ name: 'id_programa', type: 'integer' }],
        responses: [
          { code: '200', description: 'Gerências do programa.', body: 'Array<{ id_coordenador, id_programa }>' },
        ],
      },
      {
        method: 'GET',
        path: '/gerencias/coordenador/:id_coordenador',
        summary: 'Lista programas gerenciados por um coordenador.',
        pathParams: [{ name: 'id_coordenador', type: 'integer' }],
        responses: [
          { code: '200', description: 'Gerências do coordenador.', body: 'Array<{ id_coordenador, id_programa }>' },
        ],
      },
      {
        method: 'DELETE',
        path: '/gerencias/:id_coordenador/:id_programa',
        summary: 'Remove vínculo de gerência entre coordenador e programa.',
        pathParams: [
          { name: 'id_coordenador', type: 'integer' },
          { name: 'id_programa', type: 'integer' },
        ],
        responses: [
          { code: '204', description: 'Vínculo removido (sem corpo).' },
          { code: '404', description: 'Vínculo não encontrado.' },
        ],
      },
    ],
  },

  {
    id: 'anotacoes',
    title: 'Anotações Privadas',
    prefix: '/anotacoes',
    endpoints: [
      {
        method: 'POST',
        path: '/anotacoes',
        summary: 'Registra anotação qualitativa de um mentor sobre um aluno.',
        body: '{ "id_mentor": integer, "id_aluno": integer, "conteudo_texto": string }',
        responses: [
          { code: '201', description: 'Anotação registrada.', body: '{ id_mentor, id_aluno, data_registro, conteudo_texto }' },
          { code: '404', description: 'Mentor ou aluno não encontrado.' },
        ],
        rf: 'RF012',
        notes: 'Somente mentores podem criar anotações. O campo `data_registro` é preenchido automaticamente (RN13).',
      },
      {
        method: 'GET',
        path: '/anotacoes/aluno/:id_aluno',
        summary: 'Lista todas as anotações de um aluno (visão coordenador — todos os mentores).',
        pathParams: [{ name: 'id_aluno', type: 'integer' }],
        responses: [
          { code: '200', description: 'Anotações do aluno.', body: 'Array<{ id_mentor, id_aluno, data_registro, conteudo_texto }>' },
        ],
        rf: 'RF013',
        notes: 'Retorna anotações de todos os mentores sobre o aluno. Acesso restrito ao coordenador (RN13).',
      },
      {
        method: 'GET',
        path: '/anotacoes/aluno/:id_aluno/mentor/:id_mentor',
        summary: 'Lista anotações de um mentor específico sobre um aluno.',
        pathParams: [
          { name: 'id_aluno', type: 'integer' },
          { name: 'id_mentor', type: 'integer' },
        ],
        responses: [
          { code: '200', description: 'Anotações do mentor sobre o aluno.', body: 'Array<{ id_mentor, id_aluno, data_registro, conteudo_texto }>' },
        ],
        rf: 'RF013',
        notes: 'Mentor acessa apenas suas próprias anotações sobre o aluno (RN13).',
      },
      {
        method: 'GET',
        path: '/anotacoes/mentor/:id_mentor',
        summary: 'Lista todas as anotações feitas por um mentor (sobre todos os seus alunos).',
        pathParams: [{ name: 'id_mentor', type: 'integer' }],
        responses: [
          { code: '200', description: 'Anotações do mentor.', body: 'Array<{ id_mentor, id_aluno, data_registro, conteudo_texto }>' },
        ],
        rf: 'RF013',
      },
      {
        method: 'DELETE',
        path: '/anotacoes/mentor/:id_mentor/aluno/:id_aluno',
        summary: 'Remove anotação de um mentor sobre um aluno.',
        pathParams: [
          { name: 'id_mentor', type: 'integer' },
          { name: 'id_aluno', type: 'integer' },
        ],
        queryParams: [{ name: 'data', type: 'string (ISO timestamp)', description: 'data_registro da anotação a remover' }],
        responses: [
          { code: '204', description: 'Anotação removida (sem corpo).' },
          { code: '404', description: 'Anotação não encontrada.' },
        ],
        rf: 'RF012',
        notes: 'O parâmetro `data` (query string) é obrigatório para identificar a anotação pelo timestamp exato (RN13).',
      },
    ],
  },
];

// =============================================================================
// HELPERS DE RENDERIZAÇÃO
// =============================================================================

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
};

const STATUS_CLASS: Record<string, string> = {
  '2': 'status-success',
  '3': 'status-redirect',
  '4': 'status-client',
  '5': 'status-server',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function endpointAnchor(ep: Endpoint): string {
  return `${ep.method.toLowerCase()}-${ep.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function renderParamList(title: string, params: Param[]): string {
  const rows = params
    .map(
      (p) => `
      <tr>
        <td><code>${escapeHtml(p.name)}</code></td>
        <td><span class="type">${escapeHtml(p.type)}</span></td>
        <td>${escapeHtml(p.description ?? '')}</td>
      </tr>`,
    )
    .join('');
  return `
    <div class="block">
      <h4>${escapeHtml(title)}</h4>
      <table class="params">
        <thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderResponses(responses: ResponseSpec[]): string {
  const rows = responses
    .map((r) => {
      const cls = STATUS_CLASS[r.code.charAt(0)] ?? 'status-other';
      const bodyCell = r.body
        ? `<pre class="code">${escapeHtml(r.body)}</pre>`
        : '<span class="muted">sem corpo</span>';
      return `
        <tr>
          <td><span class="status ${cls}">${escapeHtml(r.code)}</span></td>
          <td>${escapeHtml(r.description)}</td>
          <td>${bodyCell}</td>
        </tr>`;
    })
    .join('');
  return `
    <div class="block">
      <h4>Respostas</h4>
      <table class="responses">
        <thead><tr><th>Status</th><th>Descrição</th><th>Body</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderEndpoint(ep: Endpoint): string {
  const anchor = endpointAnchor(ep);
  const headers = ep.headers
    ? `<div class="block"><h4>Headers</h4><pre class="code">${ep.headers.map(escapeHtml).join('\n')}</pre></div>`
    : '';
  const pathParams = ep.pathParams ? renderParamList('Path parameters', ep.pathParams) : '';
  const queryParams = ep.queryParams ? renderParamList('Query parameters', ep.queryParams) : '';
  const body = ep.body
    ? `<div class="block"><h4>Body</h4><pre class="code">${escapeHtml(ep.body)}</pre></div>`
    : '';
  const notes = ep.notes
    ? `<div class="block notes"><h4>Observações</h4><p>${escapeHtml(ep.notes)}</p></div>`
    : '';
  const rf = ep.rf
    ? `<div class="rf"><span class="rf-label">RF / RN</span><span class="rf-value">${escapeHtml(ep.rf)}</span></div>`
    : '';

  return `
    <article class="endpoint" id="${anchor}">
      <header class="endpoint-header">
        <span class="method" style="background:${METHOD_COLORS[ep.method]}">${ep.method}</span>
        <code class="path">${escapeHtml(ep.path)}</code>
        ${rf}
      </header>
      <p class="summary">${escapeHtml(ep.summary)}</p>
      ${headers}
      ${pathParams}
      ${queryParams}
      ${body}
      ${renderResponses(ep.responses)}
      ${notes}
    </article>`;
}

function renderModule(mod: ApiModule): string {
  const endpoints = mod.endpoints.map(renderEndpoint).join('\n');
  return `
    <section class="module" id="${mod.id}">
      <h2>${escapeHtml(mod.title)} <span class="prefix">${escapeHtml(mod.prefix)}</span></h2>
      ${endpoints}
    </section>`;
}

function renderSidebar(): string {
  const items = MODULES.map((m) => {
    const sub = m.endpoints
      .map(
        (ep) => `
        <li>
          <a href="#${endpointAnchor(ep)}">
            <span class="mini-method" style="background:${METHOD_COLORS[ep.method]}">${ep.method}</span>
            <span class="mini-path">${escapeHtml(ep.path)}</span>
          </a>
        </li>`,
      )
      .join('');
    return `
      <li class="nav-module">
        <a href="#${m.id}" class="nav-module-title">${escapeHtml(m.title)}</a>
        <ul>${sub}</ul>
      </li>`;
  }).join('');
  return `
    <aside class="sidebar">
      <header class="sidebar-header">
        <h1>Pulse Mais API</h1>
        <p class="version">v1 — documentação interna</p>
      </header>
      <nav><ul class="nav-list">${items}</ul></nav>
    </aside>`;
}

const STYLES = `
  :root {
    --bg: #0f172a;
    --bg-elevated: #1e293b;
    --bg-code: #0b1220;
    --border: #334155;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --accent: #38bdf8;
    --status-success: #22c55e;
    --status-redirect: #a855f7;
    --status-client: #f59e0b;
    --status-server: #ef4444;
    --status-other: #64748b;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    display: grid;
    grid-template-columns: 320px 1fr;
    min-height: 100vh;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre { font-family: "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; font-size: 13px; }

  /* SIDEBAR */
  .sidebar {
    background: var(--bg-elevated);
    border-right: 1px solid var(--border);
    padding: 24px 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
  .sidebar-header { padding: 0 24px 16px; border-bottom: 1px solid var(--border); }
  .sidebar-header h1 { margin: 0; font-size: 18px; letter-spacing: 0.5px; }
  .version { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); }
  .nav-list { list-style: none; margin: 0; padding: 8px 0; }
  .nav-module { padding: 8px 0; }
  .nav-module-title {
    display: block;
    padding: 6px 24px;
    font-weight: 600;
    color: var(--text);
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.8px;
  }
  .nav-module-title:hover { background: rgba(56, 189, 248, 0.08); text-decoration: none; }
  .nav-module ul { list-style: none; margin: 4px 0 0; padding: 0; }
  .nav-module ul li a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 24px 4px 32px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .nav-module ul li a:hover { color: var(--text); text-decoration: none; background: rgba(56, 189, 248, 0.05); }
  .mini-method {
    display: inline-block;
    min-width: 48px;
    text-align: center;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 700;
    color: #0b1220;
    letter-spacing: 0.5px;
  }
  .mini-path { font-family: "SF Mono", Menlo, Consolas, monospace; }

  /* MAIN */
  main {
    padding: 32px 48px;
    max-width: 980px;
  }
  .intro {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 32px;
  }
  .intro h1 { margin: 0 0 8px; font-size: 24px; }
  .intro p { margin: 4px 0; color: var(--text-muted); }
  .legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .legend span {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    color: #0b1220;
    letter-spacing: 0.5px;
  }

  .module { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); }
  .module:first-of-type { border-top: none; padding-top: 0; }
  .module h2 {
    margin: 0 0 16px;
    font-size: 22px;
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .prefix {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 14px;
    color: var(--accent);
    background: rgba(56, 189, 248, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 400;
  }

  /* ENDPOINT */
  .endpoint {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }
  .endpoint-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .method {
    display: inline-block;
    min-width: 64px;
    text-align: center;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    color: #0b1220;
    letter-spacing: 0.5px;
  }
  .path {
    font-size: 15px;
    color: var(--text);
    background: var(--bg-code);
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .summary { margin: 0 0 16px; color: var(--text-muted); }

  .rf {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .rf-label { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .rf-value {
    background: rgba(56, 189, 248, 0.12);
    color: var(--accent);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
  }

  .block { margin: 16px 0; }
  .block h4 {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .block.notes p {
    background: rgba(245, 158, 11, 0.08);
    border-left: 3px solid #f59e0b;
    padding: 8px 12px;
    margin: 0;
    border-radius: 0 4px 4px 0;
  }

  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    vertical-align: top;
  }
  th { color: var(--text-muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tr:last-child td { border-bottom: none; }
  td code, .code {
    background: var(--bg-code);
    padding: 2px 6px;
    border-radius: 3px;
  }
  pre.code {
    padding: 10px 14px;
    margin: 0;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    border: 1px solid var(--border);
    color: var(--text);
  }
  .type {
    color: var(--text-muted);
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
  }
  .muted { color: var(--text-muted); font-style: italic; }

  .status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    color: #0b1220;
    letter-spacing: 0.5px;
  }
  .status-success  { background: var(--status-success); }
  .status-redirect { background: var(--status-redirect); }
  .status-client   { background: var(--status-client); }
  .status-server   { background: var(--status-server); }
  .status-other    { background: var(--status-other); color: var(--text); }

  footer {
    margin-top: 64px;
    padding: 24px 0;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 12px;
  }

  @media (max-width: 900px) {
    body { grid-template-columns: 1fr; }
    .sidebar { position: static; height: auto; max-height: 360px; }
    main { padding: 24px; }
  }
`;

const INTRO_HTML = `
  <section class="intro">
    <h1>Documentação da Pulse Mais WebAPI</h1>
    <p>Referência completa dos endpoints expostos pela aplicação. Todos os erros seguem o formato <code>{ "error": "mensagem" }</code>.</p>
    <p>Use a navegação à esquerda para saltar entre módulos.</p>
    <div class="legend">
      <span style="background:#3b82f6">GET</span>
      <span style="background:#22c55e">POST</span>
      <span style="background:#f59e0b">PUT</span>
      <span style="background:#ef4444">DELETE</span>
    </div>
  </section>`;

const STATUS_LEGEND = `
  <section class="module" id="status-codes">
    <h2>Códigos de status</h2>
    <article class="endpoint">
      <table>
        <thead><tr><th>Código</th><th>Significado</th></tr></thead>
        <tbody>
          <tr><td><span class="status status-success">200</span></td><td>Sucesso em GET / PUT.</td></tr>
          <tr><td><span class="status status-success">201</span></td><td>Criação bem-sucedida.</td></tr>
          <tr><td><span class="status status-success">204</span></td><td>Deleção / inativação bem-sucedida (sem corpo).</td></tr>
          <tr><td><span class="status status-success">207</span></td><td>Importação parcial (sucesso com conflitos).</td></tr>
          <tr><td><span class="status status-client">400</span></td><td>Dados inválidos (BadRequestError).</td></tr>
          <tr><td><span class="status status-client">404</span></td><td>Recurso não encontrado (NotFoundError).</td></tr>
          <tr><td><span class="status status-client">409</span></td><td>Conflito — ex.: CPF duplicado (ConflictError).</td></tr>
          <tr><td><span class="status status-server">500</span></td><td>Erro interno do servidor.</td></tr>
        </tbody>
      </table>
    </article>
  </section>`;

// =============================================================================
// MONTAGEM FINAL
// =============================================================================

const modulesHtml = MODULES.map(renderModule).join('\n');

export const apiDocsHtml: string = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pulse Mais — API Docs</title>
  <style>${STYLES}</style>
</head>
<body>
  ${renderSidebar()}
  <main>
    ${INTRO_HTML}
    ${modulesHtml}
    ${STATUS_LEGEND}
    <footer>Pulse Mais G01 — gerado estaticamente a partir de <code>src/docs/apiDocs.ts</code>.</footer>
  </main>
</body>
</html>`;
