// Dados mockados do Portal do Ex-Aluno (Fluxo Principal 3).
// Endpoints reais que substituirão este mock:
//   GET/PUT /alunos/:id/portal    → dados editáveis do perfil
//   GET     /alunos/:id/historico → histórico pós-formação

const MOCK_EX_ALUNO = {
  id: '17',
  nome: 'Rafael Souza',
  email: 'rafael.souza@email.com',
  telefone: '(11) 97766-5544',
  cidade: 'São Paulo',
  estado: 'SP',
  endereco: 'Av. Itaquera, 890 — Zona Leste',
  escolaridade: 'Ensino Médio Completo',
  statusProfissional: 'CLT',
  empresaAtual: 'LogiStart Tecnologia',
  cargoAtual: 'Desenvolvedor Júnior',
  salarioFaixa: 'R$ 2.000 – R$ 3.500',
  areaInteresse: 'Desenvolvimento Web',
  disponibilidadeMentoria: 'Não',

  // Campos somente leitura (controlados pela equipe Pulse Mais)
  programa: 'Capacitados',
  turma: 'Turma 2024.2',
  dataIngresso: '2024-02-01',
  dataConclusao: '2024-11-30',
  dataFormatura: '2024-11-30',
  statusAluno: 'Concluído',

  // Linha do tempo da jornada; mentor: null indica que ainda não é mentor
  jornada: {
    conectado:    '2024-02-01',
    capacitado:   '2024-11-30',
    transformado: '2025-01-15',
    mentor:       null
  },

  // Indicadores históricos
  frequencia: 94,
  totalAulas: 28,
  aulasPresentes: 26,
  eventos: 9,
  mentorias: 5,

  // Conquistas e certificados do ex-aluno
  conquistas: [
    {
      titulo: 'Certificado de Conclusão — Capacitados 2024.2',
      data: '2024-11-30',
      categoria: 'Certificado',
      descricao: 'Concluiu com sucesso o programa Capacitados da Pulse Mais, com 94% de frequência.'
    },
    {
      titulo: 'Primeiro Emprego em Tecnologia',
      data: '2025-01-15',
      categoria: 'Conquista Profissional',
      descricao: 'Iniciou como Desenvolvedor Júnior na LogiStart Tecnologia após indicação da rede Pulse Mais.'
    },
    {
      titulo: 'Participação no Demo Day 2024',
      data: '2024-11-15',
      categoria: 'Evento',
      descricao: 'Apresentou projeto final para recrutadores e líderes de tecnologia no Demo Day da Pulse Mais.'
    },
    {
      titulo: 'Hackathon Pulse — 2º Lugar',
      data: '2024-09-20',
      categoria: 'Premiação',
      descricao: 'Conquistou o 2º lugar no Hackathon Pulse com um projeto de logística sustentável.'
    }
  ],

  // Histórico profissional pós-formação
  historicoProfissional: [
    {
      cargo: 'Desenvolvedor Júnior',
      empresa: 'LogiStart Tecnologia',
      inicio: '2025-01-15',
      fim: null,
      atual: true
    }
  ],

  // Histórico no programa (somente leitura)
  historicoPrograma: [
    { nome: 'Capacitados — Turma 2024.2', periodo: 'Fev 2024 — Nov 2024', status: 'Concluído' },
    { nome: 'Demo Day 2024',              periodo: 'Nov 2024',            status: 'Participou' },
    { nome: 'Hackathon Pulse 2024',        periodo: 'Set 2024',           status: '2º Lugar' }
  ]
};

// Oportunidades mockadas exibidas enquanto GET /oportunidades não está disponível
const MOCK_OPORTUNIDADES = [
  {
    id: 1,
    titulo: 'Desenvolvedor Frontend Júnior',
    empresa: 'TechNova',
    tipo: 'Vaga',
    modalidade: 'Híbrido',
    cidade: 'São Paulo',
    prazo: '2026-06-20',
    descricao: 'Vaga para dev front-end com conhecimentos em HTML, CSS e JavaScript. Aberta à rede Pulse Mais.',
    nivel: 'Júnior'
  },
  {
    id: 2,
    titulo: 'Workshop: Carreiras em Dados',
    empresa: 'Pulse Mais',
    tipo: 'Evento',
    modalidade: 'Online',
    cidade: null,
    prazo: '2026-06-15',
    descricao: 'Workshop gratuito sobre carreira em dados e BI para ex-alunos da Pulse Mais.',
    nivel: null
  },
  {
    id: 3,
    titulo: 'Estágio em QA / Testes de Software',
    empresa: 'DataSolutions',
    tipo: 'Estágio',
    modalidade: 'Presencial',
    cidade: 'São Paulo',
    prazo: '2026-06-25',
    descricao: 'Estágio em testes de software com trilha de carreira definida. Benefícios: transporte e VR.',
    nivel: 'Iniciante'
  },
  {
    id: 4,
    titulo: 'Programa de Bolsas EAD — TI',
    empresa: 'Estácio Parceira',
    tipo: 'Bolsa de Estudo',
    modalidade: 'EAD',
    cidade: null,
    prazo: '2026-07-01',
    descricao: 'Bolsas de até 70% para ex-alunos Pulse Mais em cursos de TI, ADS e Análise de Dados.',
    nivel: null
  }
];

// Retorna os dados mockados do ex-aluno; substituir por fetch('/alunos/:id/portal')
function getMockExAluno() {
  return Promise.resolve({ ...MOCK_EX_ALUNO });
}

// Simula a atualização dos campos permitidos do ex-aluno; substituir por fetch com PUT
function putMockExAluno(dadosAtualizados) {
  const CAMPOS_PERMITIDOS = ['nome', 'email', 'telefone', 'cidade', 'estado', 'endereco',
                              'escolaridade', 'statusProfissional', 'empresaAtual', 'cargoAtual', 'salarioFaixa',
                              'areaInteresse', 'disponibilidadeMentoria'];
  CAMPOS_PERMITIDOS.forEach(function (campo) {
    if (dadosAtualizados[campo] !== undefined) {
      MOCK_EX_ALUNO[campo] = dadosAtualizados[campo];
    }
  });
  return Promise.resolve({ ok: true, status: 200, data: { ...MOCK_EX_ALUNO } });
}

// Retorna as oportunidades mockadas; substituir por fetch('/oportunidades')
function getMockOportunidades() {
  return Promise.resolve([...MOCK_OPORTUNIDADES]);
}
