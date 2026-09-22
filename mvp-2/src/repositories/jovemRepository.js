// src/repositories/JovemRepository.js

const { pool } = require('../database/db');
const Jovem = require('../models/Jovem');

// Colunas permitidas para retorno - nunca SELECT *
const COLUNAS = `
id, nome, cpf, email, telefone, data_nascimento,
genero, autodeclaracao_racial, renda_familiar,
pcd, bairro, cidade, estado, tipo_moradia, multiplicador,
status_empregabilidade, status_jornada, consentimento_lgpd, ativo,
criado_em, atualizado_em
`;

// Foto do jovem: fonte única em usuarios.foto_url da conta vinculada (usuarios.jovem_id).
// Subquery correlacionada evita N+1 e dispensa aliasar toda a lista COLUNAS.
const FOTO_SUBQUERY = `(SELECT u.foto_url FROM usuarios u WHERE u.jovem_id = jovens.id LIMIT 1) AS foto_url`;

class JovemRepository {
    async criar(dados) {
        const {
            nome, cpf, email, telefone, data_nascimento,
            genero, autodeclaracao_racial, renda_familiar,
            pcd, status_jornada, consentimento_lgpd,
            bairro, cidade, estado, tipo_moradia, multiplicador, status_empregabilidade,
            ativo
        } = dados;

        const { rows } = await pool.query(
            `INSERT INTO jovens
                (nome, cpf, email, telefone, data_nascimento,
                genero, autodeclaracao_racial, renda_familiar,
                pcd, status_jornada, consentimento_lgpd, bairro,
                cidade, estado, tipo_moradia, multiplicador, status_empregabilidade, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING ${COLUNAS}`,
            [
                nome, cpf, email, telefone, data_nascimento,
                genero, autodeclaracao_racial, renda_familiar,
                pcd ?? false, status_jornada, consentimento_lgpd ?? false,
                bairro || null, cidade || null, estado || null,
                tipo_moradia || null, multiplicador ?? false, status_empregabilidade || null,
                ativo ?? true
            ]
        );

        return new Jovem(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(

            `SELECT ${COLUNAS}, ${FOTO_SUBQUERY} FROM jovens WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Jovem(rows[0]) : null;
    }

    // ExluirId existe para checar a unicidade ignorando o próprio registro no PUT
    async buscarPorCpf(cpf, excluirId = null) {
        const { rows } = await pool.query(
            `SELECT id FROM jovens
            WHERE cpf = $1 AND ($2::int IS NULL OR id <> $2)`,
            [cpf, excluirId]
        );
        return rows[0] || null;
    }

    async buscarPorEmail(email, excluirId = null) {
        const { rows } = await pool.query(
            `SELECT id FROM jovens
            WHERE email = $1 AND ($2::int IS NULL OR id <> $2)`,
            [email, excluirId]
        );
        return rows[0] || null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Padrão: só jovens ativos aparecem na listagem
        const ativo = filtros.ativo !== undefined ? filtros.ativo : true;
        condicoes.push(`ativo = $${idx++}`);
        valores.push(ativo);

        if (filtros.status_jornada) {
            condicoes.push(`status_jornada = $${idx++}`);
            valores.push(filtros.status_jornada);
        }

        if (filtros.nome) {
            //ILIKE = LIKE case-insentive no PostgreSQL
            condicoes.push(`nome ILIKE $${idx++}`);
            valores.push(`%${filtros.nome}%`);
        }

        if (filtros.multiplicador !== undefined) {
            condicoes.push(`multiplicador = $${idx++}`);
            valores.push(filtros.multiplicador === 'true' || filtros.multiplicador === true);
        }

        if (filtros.status_empregabilidade) {
            condicoes.push(`status_empregabilidade = $${idx++}`);
            valores.push(filtros.status_empregabilidade);
        }

        if (filtros.cidade) {
            condicoes.push(`cidade ILIKE $${idx++}`);
            valores.push(`%${filtros.cidade}%`);
        }

        if (filtros.programa) {
            // Subquery para filtrar por programa sem JOIN explícito aqui
            condicoes.push(
                `id IN (SELECT jovem_id FROM matriculas WHERE programa_id = $${idx++})`
            );
            valores.push(filtros.programa);
        }

        const where = `WHERE ${condicoes.join(' AND ')}`;

        const { rows } = await pool.query(
            `SELECT ${COLUNAS}, ${FOTO_SUBQUERY} FROM jovens ${where} ORDER BY nome`,
            valores
        );

        return rows.map(row => new Jovem(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        // So atualiza os campos que vieram no body
        const atualizaveis = [
            'nome', 'cpf', 'email', 'telefone', 'data_nascimento',
            'genero', 'autodeclaracao_racial', 'renda_familiar',
            'pcd', 'status_jornada', 'consentimento_lgpd', 'bairro',
            'cidade', 'estado', 'tipo_moradia', 'multiplicador', 'status_empregabilidade'
        ];
        
        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        // Se não veio nenhum campo válido, não faz UPDATE desnecessário
        if (!campos.length) return null;

        // NOW() é uma função SQL, não um parâmetro - não usa $n
        campos.push(`atualizado_em = NOW()`);
        valores.push(id); // id vira o último parâmetro ($n)

        const { rows } = await pool.query(
            `UPDATE jovens
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Jovem(rows[0]) : null;
    }

    async arquivar(id) {
        const { rows } = await pool.query(
            `UPDATE jovens
            SET ativo = false, atualizado_em = NOW()
            WHERE id = $1
            RETURNING ${COLUNAS}`,
            [id]
        );
        return rows[0] ? new Jovem(rows[0]) : null;
    }

        async buscarFicha(id) {
        const [jovemRes, matriculasRes, ensinoRes, compsRes, certsRes, freqRes, mentoriaRes] = await Promise.all([
            pool.query(`SELECT ${COLUNAS}, ${FOTO_SUBQUERY} FROM jovens WHERE id = $1`, [id]),
            pool.query(
                `SELECT m.id, m.programa_id, prog.nome AS programa_nome, m.status, m.data_matricula, m.data_conclusao, m.codigo
                FROM matriculas m
                LEFT JOIN programas prog ON prog.id = m.programa_id
                WHERE m.jovem_id = $1 ORDER BY m.criado_em DESC`,
                [id]
            ),
            pool.query(
                `SELECT id, instituicao, cursos, status, modalidade_bolsa, semestre_atual
                FROM ensino_superior WHERE jovem_id = $1 ORDER BY criado_em DESC`,
                [id]
            ),
            pool.query(
                `SELECT id, nome, tipo, nivel, instituicao, carga_horaria
                FROM competencias WHERE jovem_id = $1 ORDER BY criado_em DESC`,
                [id]
            ),
            pool.query(
                `SELECT id, nome, instituicao, data_conclusao
                FROM certificados WHERE jovem_id = $1 ORDER BY data_conclusao DESC NULLS LAST`,
                [id]
            ),
            pool.query(
                `SELECT
                    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::int AS presencas,
                    COUNT(*)::int AS total_aulas,
                    ROUND(
                        COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
                        / NULLIF(COUNT(*), 0) * 100,
                    1)::float AS percentual
                FROM frequencia WHERE jovem_id = $1`,
                [id]
            ),
            pool.query(
                `SELECT m.id, m.data_mentoria, m.status_mentoria, m.temas, u.nome AS mentor_nome
                FROM mentorias m
                JOIN usuarios u ON u.id = m.mentor_id
                JOIN mentorias_jovens mj ON mj.mentoria_id = m.id
                WHERE mj.jovem_id = $1
                ORDER BY m.data_mentoria DESC LIMIT 1`,
                [id]
            ),
        ]);

        if (!jovemRes.rows[0]) return null;

        return {
            jovem: new Jovem(jovemRes.rows[0]),
            matriculas: matriculasRes.rows,
            ensino_superior: ensinoRes.rows,
            competencias: compsRes.rows,
            certificados: certsRes.rows,
            frequencia: freqRes.rows[0],
            ultima_mentoria: mentoriaRes.rows[0] || null,
        };
    }
}

module.exports = new JovemRepository();