-- Seed 016: Notificações
-- Cobre todos os 6 tipos, mix de lidas/não lidas e broadcast (usuario_id NULL)
-- Dependência: usuarios (001)

INSERT INTO notificacoes (usuario_id, tipo, titulo, descricao, lida, link) VALUES
    -- Alertas de frequência crítica (destinados à coordenação)
    (2, 'Alerta',   'Frequência crítica: Henrique Lima',
        'Henrique Lima está com 62,5% de frequência no programa Formação Tech 2024, abaixo do mínimo de 75%.',
        FALSE, '/jovens/8'),

    (2, 'Alerta',   'Risco de evasão: Mariana Ferreira',
        'Mariana Ferreira trancou o curso superior e está com baixo engajamento nas atividades.',
        TRUE,  '/jovens/13'),

    (3, 'Alerta',   'Frequência crítica: Henrique Lima',
        'Henrique Lima atingiu 3 faltas consecutivas. Acompanhamento necessário.',
        FALSE, '/jovens/8'),

    -- Notificações de jovens (novo cadastro / atualização)
    (2, 'Jovem',    'Novo jovem cadastrado',
        'Ana Clara Silva foi cadastrada na plataforma e está aguardando matrícula.',
        TRUE,  '/jovens/1'),

    (2, 'Jovem',    'Perfil atualizado: Felipe Costa',
        'Felipe Costa foi marcado como Multiplicador após concluir o programa.',
        FALSE, '/jovens/6'),

    -- Eventos (broadcast — NULL = todos os usuários)
    (NULL, 'Evento', 'Novo evento: Workshop SQL e Banco de Dados',
        'Um novo workshop foi criado para 12/04/2025 no Lab Pulse Mais. Confirme participação dos jovens.',
        FALSE, '/eventos/7'),

    (NULL, 'Evento', 'Lembrete: Encontro da Rede Maio 2025',
        'O Encontro da Rede acontece em 10/05/2025. Inscrições abertas.',
        TRUE,  '/eventos/8'),

    -- Mentorias
    (7, 'Mentoria', 'Mentoria agendada com Ana Clara Silva',
        'Você tem uma sessão de mentoria com Ana Clara Silva em 05/04/2025.',
        TRUE,  '/mentorias/10'),

    (2, 'Mentoria', 'Meta atingida: 10 sessões de mentoria',
        'Mateo Sousa completou 10 sessões de mentoria em 2024/2025. Excelente contribuição!',
        TRUE,  '/mentorias'),

    -- Sistema (broadcast)
    (NULL, 'Sistema', 'Manutenção programada — 01/06/2025',
        'O sistema ficará indisponível das 02h às 04h do dia 01/06/2025 para atualização de infraestrutura.',
        FALSE, NULL),

    -- Conquistas
    (2, 'Conquista', 'Carla Nascimento empregada!',
        'Carla Nascimento foi contratada como Desenvolvedora Júnior na TechCorp Ltda. Parabéns!',
        FALSE, '/jovens/3'),

    (1, 'Conquista', 'Felipe Costa: evolução de carreira',
        'Felipe Costa avançou de Estagiário para Desenvolvedor Pleno na Empresa Beta S.A.',
        FALSE, '/jovens/6');

-- Notificações com usuario_id NULL = broadcast (todos os usuários recebem)
-- Henrique (jovem_id=8) gera 2 alertas — útil para testar agrupamento
-- Mix de lida=TRUE e lida=FALSE para testar "minhas notificações não lidas"
