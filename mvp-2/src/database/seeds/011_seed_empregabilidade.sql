-- Seed 011: Empregabilidade
-- Histórico profissional - alguns jovens com múltiplos registros
-- (trocarem de emprego). Permite SUM, AVG, GROUP BY por faixa 
-- salarial, e filtro por area_tech e tipo_vinculo.

INSERT INTO empregabilidade (jovem_id, empresa, cargo, data_admissao, data_saida, faixa_salarial, tipo_vinculo, area_tech, ativo) VALUES
    (3, 'TechCorp Ltda', 'Desenvolvedora Júnior', '2024-08-01', NULL, '1_a_2_SM', 'CLT', TRUE, TRUE),
    (6, 'Startup Alpha', 'Estagiário Full-Stack', '2023-09-15', '2024-06-30', 'Ate_1_SM', 'Estagio', TRUE, FALSE),
    (6, 'Empresa Beta S.A.', 'Desenvolvedor Pleno', '2024-07-15', NULL, '2_a_3_SM', 'CLT', TRUE, TRUE),
    (10, 'Mercado Local', 'Vendedor', '2023-03-01', '2024-01-15', 'Ate_1_SM', 'Informal', FALSE, FALSE),
    (10, 'Consultoria Gamma', 'Analista de Suporte', '2024-02-01', NULL, '1_a_2_SM', 'CLT', TRUE, TRUE),
    (1, 'ONG Educação Digital', 'Assistente de Projetos', '2025-01-10', NULL, 'Ate_1_SM', 'Jovem_Aprendiz', FALSE, TRUE),
    (5, 'Freelance', 'Designer Gráfica', '2024-11-01', NULL, 'Nao_informado', 'Freelancer', FALSE, TRUE),
    (2, 'DataTech Solutions', 'Estagiário de Dados', '2025-02-01', NULL, 'Ate_1_SM', 'Estagio', TRUE, TRUE);

-- Felipe (id=6) tem 2 registros (mudou de emprego) → histórico
-- João Pedro (id=10) saiu de informal para CLT → evolução
-- Alguns empregos são tech, outros não → filtro area_tech 
