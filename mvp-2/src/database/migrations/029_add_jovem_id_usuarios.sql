-- Migration 029: Vincula usuario ao jovem correspondente
-- Descrição: Permite que usuários com perfil Aluno acessem seus próprios dados via /me
-- Dependência: usuarios (001), jovens (002)

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS jovem_id INTEGER REFERENCES jovens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_jovem ON usuarios(jovem_id);
