-- Migration 002: Tabela de Jovens
-- Descrição : Entidade raíz do domínio. Armazena dados pessoais, demográficos e socioeconômicos dos jovens
-- Dependência: nenhuma (entidade raíz)

CREATE TABLE IF NOT EXISTS jovens (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL, -- Obrigatório 
    cpf CHAR(11) UNIQUE, -- Só digitios, únicos na tabela
    email VARCHAR(255) UNIQUE NOT NULL, -- Único e obrigatório 
    telefone VARCHAR(20),
    data_nascimento DATE NOT NULL, -- Obrigatório
    genero VARCHAR(30) CHECK (genero IN (
        'Masculino',
        'Feminino',
        'Prefiro_nao_informar'
    )),

    autodeclaracao_racial VARCHAR(30) CHECK (autodeclaracao_racial IN (
        'Branca',
        'Preta',
        'Parda',
        'Indígena',
        'Prefiro_nao_informar'
    )),

    renda_familiar VARCHAR(50), -- Faixa: "até 1 SM", "1 a 1.5 SM" etc.
    pcd BOOLEAN DEFAULT FALSE,

    -- Endereço (ficha do aluno: = "Cidade Tiradentes - São Paulo / SP")
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),

    -- Perfil socioeconômico (cadastro "Novo Jovem")
    tipo_moradia VARCHAR(50) CHECK (tipo_moradia IN (
        'Propria', 'Alugada', 'Cedida', 'Financiada', 'Outros'
    )),

    -- Badge "Multiplicadora" + filtro toggle "Apenas Multiplicadores"
    multiplicador BOOLEAN DEFAULT FALSE,

    -- Status geral de empregabilidade (Badge na listagem e ficha do aluno)
    status_empregabilidade VARCHAR(30) CHECK (status_empregabilidade IN (
        'Empregado', 'Em_formacao', 'Buscando', 'Empreendedor', 'Inativo'
    )),

    status_jornada VARCHAR(50) NOT NULL CHECK (status_jornada IN (
        'Conectado',
        'Capacitado',
        'Transformado',
        'Conectado_Capacitado',
        'Capacitado_Transformado',
        'Conectado_Capacitado_Transformado'
    )),

    consentimento_lgpd BOOLEAN DEFAULT FALSE, -- Art. 14 LGPD (menores de 18)
    ativo BOOLEAN DEFAULT TRUE, 
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para filtros frequentes 
CREATE INDEX IF NOT EXISTS idx_jovens_status_jornada ON jovens(status_jornada);
CREATE INDEX IF NOT EXISTS idx_jovens_cpf ON jovens(cpf);
CREATE INDEX IF NOT EXISTS idx_jovens_nome ON jovens(nome);
CREATE INDEX IF NOT EXISTS idx_jovens_cidade ON jovens(cidade);
CREATE INDEX IF NOT EXISTS idx_jovens_multiplicador ON jovens(multiplicador);
CREATE INDEX IF NOT EXISTS idx_jovens_status_empregabilidade ON jovens(status_empregabilidade);
