// src/tests/fixtures.js

/**
 * Gera um Usuário fictício com dados válidos.
 */
const criarUsuarioFixture = (overrides = {}) => {
  const sufixo = Math.floor(Math.random() * 1000000);
  return {
    nome: 'Denise Ferreira',
    email: `denise.${sufixo}@pulsemais.org.br`,
    senha: 'senhaSegura123',
    perfil: 'Coordenacao',
    ativo: true,
    ...overrides,
  };
};

/**
 * Gera um Jovem fictício com dados válidos.
 */
const criarJovemFixture = (overrides = {}) => {
  const sufixo = String(Math.floor(Math.random() * 1000000000)).padStart(9, '9');
  return {
    nome: 'Beatriz Santos',
    cpf: `123${sufixo.slice(-8)}`,
    email: `beatriz.${sufixo}@gmail.com`,
    data_nascimento: '2006-03-12',
    status_jornada: 'Conectado',
    ...overrides,
  };
};

/**
 * Gera um Evento fictício com dados válidos.
 */
const criarEventoFixture = (overrides = {}) => {
  const sufixo = Math.floor(Math.random() * 1000);
  return {
    nome: `Workshop de Tecnologia #${sufixo}`,
    data_inicio: new Date().toISOString(),
    tipo: 'Workshop',
    descricao: 'Aprenda lógica de programação.',
    local: 'Plataforma Online',
    vagas: 30,
    ...overrides,
  };
};

module.exports = {
  criarUsuarioFixture,
  criarJovemFixture,
  criarEventoFixture,
};
