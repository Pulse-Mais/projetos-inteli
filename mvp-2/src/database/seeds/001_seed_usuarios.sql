-- Seed 001: Usuários do Sistema
-- Todos os 5 perfis representados
-- Senhas fictícias hasheadas

-- Limpa todas as tabelas antes de reinserir (seeds são idempotentes)
TRUNCATE TABLE usuarios, jovens, programas, eventos RESTART IDENTITY CASCADE;

INSERT INTO usuarios (nome, email, senha_hash, perfil, cargo, telefone, ativo) VALUES
    ('Valentina Rocha', 'valentina@pulsemais.org.br', '$2b$10$ficticioHashGestaoGeral001', 'GestaoGeral', 'Diretora Executiva', '11991110001', TRUE),
    ('Denise Ferreira', 'denise@pulsemais.org.br', '$2b$10$ficticioHashCoordenacao002', 'Coordenacao', 'Coordenadora Pedagógica', '11991110002', TRUE),
    ('Lucas Mendes', 'lucas@pulsemais.org.br', '$2b$10$ficticioHashAssistente003', 'Assistente', 'Assistente Social', '11991110003', TRUE),
    ('Ricardo Almeida', 'ricardo@pulsemais.org.br', '$2b$10$ficticioHashPsicologa004', 'Psicologa', 'Psicólogo Clínico', '11991110004', TRUE),
    ('Beatriz Santos', 'beatriz.aluna@pulsemais.org.br', '$2b$10$ficticioHashAluno005', 'Aluno', NULL, NULL, TRUE),
    ('Camila Oliveira', 'camila@pulsemais.org.br', '$2b$10$ficticioHashAssistente006',  'Assistente', 'Assistente de Projetos', '11991110006', TRUE),
    ('Mateo Sousa', 'mateo@pulsemais.org.br', '$2b$10$ficticioHashCoordenacao007', 'Coordenacao', 'Coordenador de Mentoria', '11991110007', TRUE),
    ('Ana Paula', 'anapaula@pulsemais.org.br', '$2b$10$ficticioHashPsicologa008', 'Psicologa', 'Psicóloga', '11991110008', FALSE);

-- Ana Paula (id=8) está inativa — útil para testar filtro WHERE ativo = TRUE
