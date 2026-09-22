-- Seed 007: Atendimento de Saúde Mental
-- Dados segregados - acesso restrito 
-- Poucos registros, apenas para profissionais autorizados

INSERT INTO atendimentos_saude_mental (jovem_id, profissional_id, data_atendimento, resumo, encaminhamento) VALUES
    (5, 4, '2024-04-10', 'Elena relatou episódios de ansiedade relacionados a pressão financeira. Orientada 
    sobre técnicas de respiração e manejo de estresse.', 'Encaminhada para acompanhamento quinzenal.'),
    (5, 4, '2024-04-24', 'Segunda sessão com Elena. Relato de melhora parcial. Mantém dificuldade para dormir.',
    'Sugerir avaliação médica complementar.'),
    (8, 4, '2024-03-20', 'Henrique procurou atendimento após faltas consecutivas. Relata conflitos familiares.', 
    'Acompanhamento semanal por 4 semanas.'),
    (8, 4, '2024-03-27', 'Henrique demonstrou abertura para dialogar. Situação familiar em estabilização.', NULL),
    (2, 4, '2024-06-15', 'Bruno solicitou atendimento espontâneo. Tema: insegurança sobre entrada no mercado de trabalho.',
    'Sessão de orientação vocacional agendada.');
