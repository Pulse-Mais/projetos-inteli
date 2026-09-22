// Dados mockados do Portal do Aluno (Fluxo Principal 2).
// Centraliza todos os dados estáticos usados enquanto a API real não está disponível.
// Para integrar com a API, substituir as funções abaixo por chamadas fetch():
//   GET /alunos/:id/portal  → leitura
//   PUT /alunos/:id/portal  → atualização dos campos permitidos

const MOCK_ALUNO = {
  id: '42',
  nome: 'Luana Santos',
  email: 'luana.santos@email.com',
  telefone: '(11) 98877-6655',
  cidade: 'São Paulo',
  estado: 'SP',
  endereco: 'Rua das Flores, 123 — Jardim Sul',

  // Campos somente leitura (controlados pela equipe Pulse Mais)
  programa: 'Capacitados',
  turma: 'Turma 2026.1',
  dataIngresso: '2026-02-10',
  escolaridade: 'Ensino Médio Completo',
  statusProfissional: 'Estudante',

  // Indicadores (somente leitura)
  frequencia: 88,
  totalAulas: 32,
  aulasPresentes: 28,
  eventos: 7,
  mentorias: 3,
  etapaPrograma: 'Em andamento',

  // Soft Skills (escala 1-5, registrados pela coordenação)
  softSkills: [
    { nome: 'Comunicação',       valor: 4 },
    { nome: 'Trabalho em equipe', valor: 5 },
    { nome: 'Proatividade',       valor: 3 },
    { nome: 'Liderança',          valor: 3 },
    { nome: 'Resolução de problemas', valor: 4 }
  ],

  // Hard Skills (escala 0-100)
  hardSkills: [
    { nome: 'HTML & CSS',      valor: 80 },
    { nome: 'JavaScript',      valor: 65 },
    { nome: 'Git & GitHub',    valor: 70 },
    { nome: 'SQL Básico',      valor: 55 },
    { nome: 'Lógica de Programação', valor: 75 }
  ],

  // Próximas atividades
  proximasAtividades: [
    { nome: 'Aula: Introdução a APIs',   data: '2026-06-12', tipo: 'Aula',      status: 'pendente' },
    { nome: 'Workshop: Git Avançado',    data: '2026-06-14', tipo: 'Workshop',  status: 'pendente' },
    { nome: 'Mentoria com Fabrício',     data: '2026-06-17', tipo: 'Mentoria',  status: 'pendente' },
    { nome: 'Demo Day — Turma 2026.1',   data: '2026-06-28', tipo: 'Evento',    status: 'pendente' }
  ],

  // Histórico de programas (somente leitura)
  historicoPrograma: [
    { nome: 'Capacitados — Turma 2026.1', periodo: 'Fev 2026 — Em andamento', status: 'Em andamento' },
    { nome: 'Evento: Hackathon Pulse',     periodo: 'Mai 2026',               status: 'Participou' },
    { nome: 'Workshop: Soft Skills',       periodo: 'Mar 2026',               status: 'Concluído' }
  ]
};

// Retorna os dados mockados do aluno; substituir por fetch('/alunos/:id/portal') quando disponível
function getMockAluno() {
  return Promise.resolve({ ...MOCK_ALUNO });
}

// Simula a atualização dos campos permitidos no Portal do Aluno (RN09).
// Campos restritos são ignorados silenciosamente.
// Substituir por fetch('/alunos/:id/portal', { method: 'PUT', body: JSON.stringify(dados) })
function putMockAluno(dadosAtualizados) {
  const CAMPOS_PERMITIDOS = ['nome', 'email', 'telefone', 'cidade', 'estado', 'endereco', 'statusProfissional', 'escolaridade'];

  CAMPOS_PERMITIDOS.forEach(campo => {
    if (dadosAtualizados[campo] !== undefined) {
      MOCK_ALUNO[campo] = dadosAtualizados[campo];
    }
  });

  return Promise.resolve({ ok: true, status: 200, data: { ...MOCK_ALUNO } });
}
