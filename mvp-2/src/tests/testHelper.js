// src/tests/testHelper.js
const { pool } = require('../database/db');

/**
 * Cria um objeto Mock Request básico para testar middlewares e controllers isoladamente.
 */
const createMockReq = (options = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    // Usuário autenticado padrão (perfil administrativo). Os controllers leem
    // req.usuario.perfil/id/jovem_id após o middleware authenticate; nos testes
    // de unidade esse objeto é injetado aqui para reproduzir o estado pós-auth.
    usuario: { id: 1, perfil: 'GestaoGeral', nome: 'Usuario de Teste', jovem_id: null },
    ...options,
  };
};

/**
 * Cria um objeto Mock Response básico com métodos encadeados e espiões Jest.
 */
const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Hook para gerenciar o estado do banco de dados de testes.
 * Executa a limpeza (TRUNCATE) antes de cada teste e encerra a conexão após todos os testes do arquivo.
 */
const setupTestDB = () => {
  beforeEach(async () => {
    await limparBancoDeDados();
  });

  afterAll(async () => {
    await pool.end();
  });
};

/**
 * Executa o comando TRUNCATE em todas as tabelas em ordem de dependência reversa
 * reiniciando os IDs incrementais (RESTART IDENTITY).
 */
async function limparBancoDeDados() {
  const tabelas = [
    'entregas_atividades',
    'atividades',
    'notificacoes',
    'log_auditoria',
    'ensino_superior',
    'empregabilidade',
    'mentorias',
    'participacoes_eventos',
    'atendimentos_saude_mental',
    'anotacoes',
    'frequencia',
    'matriculas',
    'eventos',
    'programas',
    'jovens',
    'usuarios'
  ];

  const query = `TRUNCATE TABLE ${tabelas.join(', ')} RESTART IDENTITY CASCADE;`;
  await pool.query(query);
}

module.exports = {
  createMockReq,
  createMockRes,
  setupTestDB,
  limparBancoDeDados,
};
