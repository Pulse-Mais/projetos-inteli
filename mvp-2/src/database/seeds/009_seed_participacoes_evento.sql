-- Seed 009: Participações em Eventos
-- Distribuição variada para exercitar COUNT por evento, jovens com mais participação
-- (reincidência), e LEFT JOIN para encontrar jovens que nunca participaram do evento

INSERT INTO participacoes_eventos (jovem_id, evento_id, presente) VALUES
    -- Evento Tech Jun/2024 (id=1): 8 participantes
   (1, 1, TRUE), (2, 1, TRUE), (3, 1, TRUE), (4, 1, TRUE),
   (5, 1, TRUE), (6, 1, TRUE), (8, 1, TRUE), (13, 1, TRUE),

    -- Encontro da Rede Ago/2024 (id=2): 5 participantes
    (1, 2, TRUE), (3, 2, TRUE), (5, 2, TRUE), (6, 2, TRUE), (10, 2, TRUE),

    -- Workshop Git (id=3): 6 participantes
     (1, 3, TRUE), (2, 3, TRUE), (4, 3, TRUE), (7, 3, TRUE), (12, 3, TRUE), (14, 3, TRUE),

    -- Palestra Mercado (id=4): 4 participantes
     (2, 4, TRUE), (3, 4, TRUE), (5, 4, TRUE), (12, 4, TRUE),

    -- Pulse+ Dez/2024 (id=5): 10 participantes
     (1, 5, TRUE), (2, 5, TRUE), (3, 5, TRUE), (4, 5, TRUE), (5, 5, TRUE),
     (6, 5, TRUE), (7, 5, TRUE), (10, 5, TRUE), (12, 5, TRUE), (13, 5, TRUE),

    -- Evento Tech Mar/2025 (id=6): 4 participantes
        (1, 6, TRUE), (4, 6, TRUE), (7, 6, TRUE), (12, 6, TRUE),

    -- Workshop SQL Abr/2025 (id=7): 3 participantes
    (1, 7, TRUE), (4, 7, TRUE), (14, 7, TRUE);

-- Jovens 9, 11, 15 nunca participaram de eventos → LEFT JOIN + IS NULL
-- Ana Clara (id=1) participou de 7 eventos → reincidência alta
-- Nathan (id=14) participou de 2 → reincidência baixa