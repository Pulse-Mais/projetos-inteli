-- Seed 018: Mentorias ↔ Jovens (relação N:N)
-- Vincula as sessões do seed 010 com seus jovens mentorados
-- Mentorias 2 e 7 têm múltiplos jovens para demonstrar o N:N

INSERT INTO mentorias_jovens (mentoria_id, jovem_id) VALUES
    (1,  1), -- Ana Clara (1) na sessão de ago/2024
    (2,  2), -- Bruno (2) — boa performance
    (2,  3), -- Carla (3) — mesma sessão (N:N)
    (3,  2), -- Bruno (2) na sessão de DevOps
    (4,  3), -- Carla (3) na sessão de projetos
    (5,  5), -- Elena (5) na sessão de ago/2024
    (6,  7), -- Giovanna (7) — sessão agendada
    (7,  6), -- Felipe (6) — será mentor
    (7, 13), -- Mariana (13) — mesma sessão (N:N)
    (8,  8), -- Henrique (8) — planejamento de recuperação
    (9, 12), -- Leonardo (12) — migração para análise de dados
    (10, 1); -- Ana Clara (1) — acompanhamento pós-contratação
