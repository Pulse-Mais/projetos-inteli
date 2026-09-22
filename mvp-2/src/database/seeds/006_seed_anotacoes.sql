-- Seed 006: Anotações Qualitativas
-- Categorias variadas para demonstrar GROUP BY por categoria
-- COUNT por autor, e filtros com WHERE + IN

INSERT INTO anotacoes (jovem_id, autor_id, categoria, texto) VALUES
(1, 2, 'Mentoria', 'Ana Clara demonstrou evolução na comunicação durante a sessão de mentoria. Apresentou seu projeto com clareza.'),
(1, 2, 'Evolucao_Geral', 'Jovem engajada, participa ativamente das aulas e ajuda colegas com dificuldades.'),
(2, 2, 'Mentoria', 'Bruno está desenvolvendo habilidades de liderança no grupo de estudos.'),
(2, 3, 'Academico', 'Entregou todas as atividades dentro do prazo. Bom desempenho em lógica de programação.'),
(3, 2, 'Evolucao_Geral', 'Carla foi indicada como monitora para a próxima turma pela qualidade das entregas.'),
(3, 2, 'Mentoria', 'Sessão focada em preparação para entrevistas de emprego. Realizou simulação.'),
(4, 3, 'Academico', 'Diego precisa de reforço em matemática. Agendado tutoria extra.'),
(5, 2, 'Atendimento', 'Elena relatou dificuldades financeiras que estão impactando sua rotina de estudos.'),
(8, 3, 'Outro', 'Henrique informou que vai precisar se ausentar por duas semanas por motivos familiares.'),
(8, 2, 'Evolucao_Geral', 'Após retorno, Henrique demonstrou queda de engajamento. Acompanhar de perto.'),
(6, 2, 'Mentoria', 'Felipe participou como mentor voluntário na turma de 2024, excelente contribuição.'),
(12, 3, 'Academico', 'Leonardo demonstra facilidade com banco de dados, mas precisa melhorar em front-end.');
