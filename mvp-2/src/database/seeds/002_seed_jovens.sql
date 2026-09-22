-- Seed 002: Jovens
-- 15 registros com variedades de status_jornada, gênero, autodeclaração etc.
-- Inclui: bairro/cidade/estado, tipo_moradia, multiplicador, status_empregabilidade
-- CPFs fictícios — alguns NULL para testar IS NULL (registros legados)

INSERT INTO jovens (
    nome, cpf, email, telefone, data_nascimento,
    genero, autodeclaracao_racial, renda_familiar, pcd,
    bairro, cidade, estado, tipo_moradia,
    multiplicador, status_empregabilidade,
    status_jornada, consentimento_lgpd, ativo
) VALUES
    ('Ana Clara Silva', '11111111111', 'ana.clara@email.com', '11999990001', '2003-05-14', 'Feminino', 'Parda', 'Ate_1_SM', FALSE, 'Cidade Tiradentes', 'São Paulo', 'SP', 'Alugada', FALSE, 'Em_formacao', 'Conectado', TRUE, TRUE),
    ('Bruno Oliveira', '22222222222', 'bruno.oli@email.com', '11999990002', '2002-08-22', 'Masculino', 'Preta', '1_a_1.5_SM', FALSE, 'Guaianases', 'São Paulo', 'SP', 'Propria', FALSE, 'Em_formacao', 'Capacitado', TRUE, TRUE),
    ('Carla Nascimento', '33333333333', 'carla.nasc@email.com', '11999990003', '2004-01-10', 'Feminino', 'Branca', 'Ate_1_SM', FALSE, 'Itaquera', 'São Paulo', 'SP', 'Alugada', TRUE,  'Empregado', 'Transformado', TRUE, TRUE),
    ('Diego Santos', '44444444444', 'diego.santos@email.com', '11999990004', '2001-11-30', 'Masculino', 'Parda', '1_a_1.5_SM', FALSE, 'Cidade Tiradentes', 'São Paulo', 'SP', 'Cedida', FALSE, 'Buscando', 'Conectado_Capacitado', TRUE, TRUE),
    ('Elena Rodrigues', '55555555555', 'elena.rod@email.com', '11999990005', '2003-03-18', 'Feminino', 'Preta', 'Ate_1_SM', TRUE, 'São Mateus', 'São Paulo', 'SP', 'Alugada', FALSE, 'Empregado', 'Capacitado_Transformado', TRUE, TRUE),
    ('Felipe Costa', '66666666666', 'felipe.costa@email.com', '11999990006', '2000-07-25', 'Masculino', 'Branca', '1_a_1.5_SM', FALSE, 'Penha', 'São Paulo', 'SP', 'Alugada', TRUE,  'Empregado', 'Conectado_Capacitado_Transformado', TRUE, TRUE),
    ('Giovanna Pereira', '77777777777', 'gio.pereira@email.com', '11999990007', '2004-09-03', 'Feminino', 'Indígena', 'Ate_1_SM', FALSE, 'Cidade Tiradentes', 'São Paulo', 'SP', 'Propria', FALSE, 'Buscando', 'Conectado', TRUE, TRUE),
    ('Henrique Lima', '88888888888', 'henrique.lima@email.com', '11999990008', '2002-12-15', 'Masculino', 'Parda', 'Ate_1_SM', FALSE, 'Itaquera', 'São Paulo', 'SP', 'Cedida', FALSE, 'Buscando', 'Capacitado', TRUE, TRUE),
    ('Isabela Martins', NULL, 'isabela.mart@email.com', '11999990009', '2003-06-20', 'Feminino', 'Prefiro_nao_informar', 'Ate_1_SM', FALSE, 'Vila Prudente', 'São Paulo', 'SP', 'Alugada', FALSE, 'Em_formacao', 'Conectado', FALSE, TRUE),
    ('João Pedro Alves', NULL, 'joao.alves@email.com', '11999990010', '2001-02-28', 'Masculino', 'Preta', '1_a_1.5_SM',  FALSE, 'Guaianases', 'São Paulo', 'SP', 'Propria', TRUE,  'Empregado', 'Transformado', FALSE, TRUE),
    ('Karen Souza', '10101010101', 'karen.souza@email.com', NULL, '2004-04-12', 'Feminino', 'Parda', 'Ate_1_SM', TRUE,  'São Mateus', 'São Paulo', 'SP', 'Alugada', FALSE, 'Inativo', 'Conectado', TRUE, TRUE),
    ('Leonardo Ribeiro', '12121212121', 'leo.ribeiro@email.com', '11999990012', '2003-10-08', 'Masculino', 'Branca', 'Ate_1_SM', FALSE, 'Cidade Tiradentes', 'São Paulo', 'SP', 'Propria', FALSE, 'Buscando', 'Capacitado', TRUE, TRUE),
    ('Mariana Ferreira', '13131313131', 'mari.ferreira@email.com', '11999990013', '2002-07-17', 'Feminino', 'Parda', '1_a_1.5_SM',  FALSE, 'Itaquera', 'São Paulo', 'SP', 'Financiada', FALSE, 'Buscando', 'Conectado_Capacitado', TRUE, TRUE),
    ('Nathan Gomes', '14141414141', 'nathan.gomes@email.com', '11999990014', '2005-01-05', 'Masculino', 'Prefiro_nao_informar', 'Ate_1_SM', FALSE, 'São Mateus', 'São Paulo', 'SP', 'Propria', FALSE, 'Em_formacao',  'Conectado', TRUE, TRUE),
    ('Olivia Campos', '15151515151', 'olivia.campos@email.com', '11999990015', '2003-08-29', 'Prefiro_nao_informar', 'Preta', 'Ate_1_SM', FALSE, 'Guaianases', 'São Paulo', 'SP', 'Alugada', FALSE, 'Inativo', 'Capacitado', TRUE, FALSE);

-- Olivia (id=15) está inativa (ativo=FALSE) — jovem evadida, útil para filtros
-- Isabela e João Pedro não têm CPF (NULL) — registros legados
-- Karen não tem telefone (NULL) — testar IS NULL
-- Carla, Felipe, João Pedro são multiplicadores (badge na listagem)
-- status_empregabilidade permite filtros/badges no dashboard
