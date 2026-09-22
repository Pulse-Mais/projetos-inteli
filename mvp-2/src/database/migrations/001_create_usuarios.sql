-- Migration 001: Tabela Usuários do Sistema
-- Descrição: Usuários internos operam a plataforma 
-- Dependência: Nenhuma (Tabela Raíz)

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- RN07: bcrypt, mín 8 chars na entrada
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN (
        'GestaoGeral', -- Vizualiza tudo, não altera
        'Coordenacao', -- Vizualiza e altera
        'Assistente', -- Vizualiza e altera (escopo limitado)
        'Psicologa', -- acesso a saúde mental
        'Aluno', -- acesso restrito ao próprio perfil
        'Mentor' -- acesso ao seu perfil e mentorias
    )),
    cargo VARCHAR(100), -- Ex.: Coordenadora pedagógica (Tela de configurações)
    telefone VARCHAR(20), -- Contato do Usuário
    foto_url VARCHAR(500), -- URL da foto de perfil (Supabase Sotarege)
    fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- Índice para buscar por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);