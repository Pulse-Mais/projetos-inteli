-- Seed 024: Disciplinas
-- Histórico acadêmico para jovens com ensino superior (seed 012)
-- ensino_superior_id: 1=Carla(FATEC), 5=Bruno(FIAP), 6=Ana Clara(Univ.ABC), 7=Mariana(trancada)

INSERT INTO disciplinas (ensino_superior_id, nome, status, semestre) VALUES
    -- Ana Clara (ensino_superior_id=6, Sistemas de Informação)
    (6, 'Lógica de Programação', 'Aprovado', '2025.1'),
    (6, 'Cálculo I', 'Em_andamento', '2025.1'),
    (6, 'Álgebra Linear', 'Em_andamento', '2025.1'),
    (6, 'Introdução à Computação', 'Aprovado', '2025.1'),

    -- Bruno (ensino_superior_id=5, Engenharia de Software)
    (5, 'Estrutura de Dados', 'Em_andamento', '2025.1'),
    (5, 'Programação Orientada a Objetos', 'Aprovado', '2025.1'),
    (5, 'Banco de Dados','Em_andamento', '2025.1'),

    -- Carla (ensino_superior_id=1, ADS FATEC)
    (1, 'Algoritmos', 'Aprovado', '2024.2'),
    (1, 'Desenvolvimento Web', 'Aprovado', '2024.2'),
    (1, 'Redes de Computadores', 'Em_andamento', '2025.1'),

    -- Mariana trancou (ensino_superior_id=7)
    (7, 'Introdução à Administração', 'Trancado', '2024.2');
