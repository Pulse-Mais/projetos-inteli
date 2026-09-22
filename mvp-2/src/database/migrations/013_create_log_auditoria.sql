-- Migration 013: Tabela Log de Auditoria 
-- Descrição: Registro imutável de toda escrita em campos sensíveis
-- Dependências: usuarios

CREATE TABLE IF NOT EXISTS log_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER, -- Null se usuário não identificado
    entidade VARCHAR(100) NOT NULL, -- ex.: 'jovens', 'atendimento_saude_mental'
    entidade_id INTEGER, -- PK do registro alterado
    operacao VARCHAR(20) NOT NULL CHECK (operacao IN (
        'INSERT',
        'UPDATE',
        'DELETE',
        'ACESSO_NEGADO' --Tentativa 401/403
    )),
    dados_anteriores JSONB, -- Snapshot antes da alteração
    dados_novos JSONB,  -- Snapshot depois da alteração
    ip_origem VARCHAR(45), -- IPv4 ou IPv6
    rota VARCHAR(255), -- ex: '/api/jovens/42'
    metodos_http VARCHAR(10), -- GET, POST, PUT, DELETE
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

    CONSTRAINT fk_log_auditoria_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para consultas de auditoria 
CREATE INDEX IF NOT EXISTS idx_log_auditoria_usuario ON log_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_entidade ON log_auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_criado_em ON log_auditoria(criado_em);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_operacao ON log_auditoria(operacao);