// src/services/importacaoService.js

const { Readable } = require('stream');
const csvParser = require('csv-parser');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');

const TIPOS_PRESENCA = ['Presencial', 'Gravacao', 'Ausente'];
const CAMPOS_OBRIGATORIOS = ['jovem_id', 'data_aula', 'tipo_presenca'];

function parseCsv(buffer) {
    return new Promise((resolve, reject) => {
        const resultado = [];
        Readable.from([buffer])
            .pipe(csvParser())
            .on('data', row => resultado.push(row))
            .on('end', () => resolve(resultado))
            .on('error', reject);
    });
}

function validarLinha(row) {
    const erros = [];

    for (const campo of CAMPOS_OBRIGATORIOS) {
        if (!row[campo] || !String(row[campo]).trim()) {
            erros.push(`campo obrigatório ausente: ${campo}`);
        }
    }

    if (row.tipo_presenca && !TIPOS_PRESENCA.includes(row.tipo_presenca.trim())) {
        erros.push(`tipo_presenca inválido: "${row.tipo_presenca}". Use: ${TIPOS_PRESENCA.join(', ')}`);
    }

    if (row.jovem_id && isNaN(parseInt(row.jovem_id, 10))) {
        erros.push(`jovem_id deve ser numérico: "${row.jovem_id}"`);
    }

    return erros;
}

class ImportacaoService {

    async previewCsv(buffer) {
        if (!buffer || buffer.length === 0) {
            throw new BadRequestError('Arquivo CSV vazio ou não enviado');
        }

        const rows = await parseCsv(buffer);

        if (rows.length === 0) {
            throw new BadRequestError('O arquivo CSV não contém dados');
        }

        const validos = [];
        const invalidos = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const erros = validarLinha(row);

            const registro = {
                linha: i + 2,
                jovem_id: parseInt(row.jovem_id, 10) || null,
                data_aula: row.data_aula?.trim() || null,
                tipo_presenca: row.tipo_presenca?.trim() || null,
                programa_id: row.programa_id ? parseInt(row.programa_id, 10) : null,
                observacao: row.observacao?.trim() || null,
            };

            if (erros.length) {
                invalidos.push({ ...registro, erros });
            } else {
                validos.push(registro);
            }
        }

        return { total: rows.length, validos, invalidos };
    }

    async confirmarImportacao(registros, responsavel_id) {
        if (!Array.isArray(registros) || registros.length === 0) {
            throw new BadRequestError('Nenhum registro válido para importar');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let importados = 0;

            for (const r of registros) {
                await client.query(
                    `INSERT INTO frequencia
                        (jovem_id, data_aula, tipo_presenca, responsavel_id, programa_id, observacao)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [r.jovem_id, r.data_aula, r.tipo_presenca, responsavel_id, r.programa_id || null, r.observacao || null]
                );
                importados++;
            }

            await client.query('COMMIT');
            return { importados };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = new ImportacaoService();