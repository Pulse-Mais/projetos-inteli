-- Migration 016: Notificações
-- As notificações são geradas automaticamente pela camada de Service quando 
-- eventos relevantes ocorrem (ex: jovem cadastrado, mentoria agendada, 
-- frequência abaixo de 75%). O campo `link` armazena a rota interna para 
-- redirecionamento ao clicar na notificação.
-- Dependência: usuarios (001)

CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER, -- Destinatário, NULL = broadcast(todos)
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'Alerta', -- Risco de evasão, frequência crítica
        'Jovem', -- Novo cadastro, atualizações de perfil
        'Evento', -- Evento criado, lembrete de evento
        'Mentoria', -- Mentoria agendada, realizada, cancelada
        'Sistema', -- Manuntenção, atualizações da plataforma
        'Conquista' -- Jovem empregado, conclusão de programa
    )),
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    lida BOOLEAN DEFAULT FALSE,
    link VARCHAR(500), -- Rota interna: ex.: "/jovens/42"
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacoes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índice por usuário + lida: query principal "minhas notificações não lidas"
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuarios_lida ON notificacoes(usuario_id, lida);

-- Índice por tipo: filtro por categoria na interface
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);

-- Índice por data: ordenação cronológica (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON notificacoes(criado_em);