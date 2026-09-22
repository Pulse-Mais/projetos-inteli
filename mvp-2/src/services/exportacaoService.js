// src/services/exportacaoService.js

const { Parser } = require('json2csv');
const ical = require('ical-generator');
const { pool } = require('../database/db');
const eventoRepository = require('../repositories/eventoRepository');

class ExportacaoService {

    async exportarJovens() {
        const { rows } = await pool.query(
            `SELECT j.id, j.nome, j.cpf, j.data_nascimento, j.email, j.telefone,
                    j.status_jornada, j.status_empregabilidade,
                    j.bairro, j.cidade, j.estado, j.criado_em,
                    (SELECT p.nome FROM programas p
                     JOIN matriculas m ON m.programa_id = p.id
                     WHERE m.jovem_id = j.id AND m.status = 'Ativo'
                     LIMIT 1) AS programa,
                    (SELECT m.turma FROM matriculas m
                     WHERE m.jovem_id = j.id AND m.status = 'Ativo'
                     LIMIT 1) AS turma
             FROM jovens j
             WHERE j.ativo = true
             ORDER BY j.nome`
        );

        const campos = [
            { label: 'ID', value: 'id' },
            { label: 'Nome', value: 'nome' },
            { label: 'CPF', value: 'cpf' },
            { label: 'Data Nascimento', value: row => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '' },
            { label: 'Email', value: 'email' },
            { label: 'Telefone', value: row => row.telefone || '' },
            { label: 'Status Jornada', value: 'status_jornada' },
            { label: 'Status Empregabilidade', value: row => row.status_empregabilidade || '' },
            { label: 'Bairro', value: row => row.bairro || '' },
            { label: 'Cidade', value: row => row.cidade || '' },
            { label: 'Estado', value: row => row.estado || '' },
            { label: 'Programa', value: row => row.programa || '' },
            { label: 'Turma', value: row => row.turma || '' },
            { label: 'Cadastrado em', value: row => row.criado_em ? new Date(row.criado_em).toLocaleString('pt-BR') : '' },
        ];

        const parser = new Parser({ fields: campos });
        return parser.parse(rows);
    }

    async exportarEventosIcal() {
        const eventos = await eventoRepository.listarTodos();

        const cal = ical({ name: 'Pulse Mais — Eventos' });

        for (const evento of eventos) {
            cal.createEvent({
                start: new Date(evento.data_inicio),
                end: evento.data_fim ? new Date(evento.data_fim) : new Date(evento.data_inicio),
                summary: evento.nome,
                description: evento.descricao || '',
                location: evento.local || '',
            });
        }

        return cal.toString();
    }
}

module.exports = new ExportacaoService();
