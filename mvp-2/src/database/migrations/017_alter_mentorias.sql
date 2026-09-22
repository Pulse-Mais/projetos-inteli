-- Migration 017: Alteração da tabela de Mentorias
-- Descrição: Substitui colunas de texto livre por referência ao usuário mentor
--            e normaliza a duração para minutos inteiros.
-- Dependência: usuarios (001), mentorias (010)

-- Remove colunas antigas substituídas pela nova estrutura
ALTER TABLE mentorias DROP COLUMN IF EXISTS jovem_id;
ALTER TABLE mentorias DROP COLUMN IF EXISTS nome_mentoria;
ALTER TABLE mentorias DROP COLUMN IF EXISTS tempo_mentoria;
ALTER TABLE mentorias DROP COLUMN IF EXISTS carga_horaria_mentoria;
ALTER TABLE mentorias DROP COLUMN IF EXISTS mentor; -- era texto livre, substituído por mentor_id

-- Adiciona FK para o usuário que realiza a mentoria
ALTER TABLE mentorias ADD COLUMN mentor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT;

-- Duração em minutos no lugar de campos de texto/numérico separados
ALTER TABLE mentorias ADD COLUMN duracao_minutos INTEGER NOT NULL DEFAULT 0;

-- Índice por mentor: query principal "minhas mentorias"
CREATE INDEX IF NOT EXISTS idx_mentorias_mentor_id ON mentorias(mentor_id);
