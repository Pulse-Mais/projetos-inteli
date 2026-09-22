import { pool } from '../db/pool';
import { gerarCsv } from '../helpers/gerarCsv';

interface FiltrosExport {
  categoria_atual?: string;
  status_global?: string;
  id_programa?: number;
  ano_matricula?: number;
}

export async function exportarJovens(filtros: FiltrosExport): Promise<string> {
  const condicoes: string[] = [];
  const valores: unknown[] = [];
  let idx = 1;

  if (filtros.categoria_atual) {
    condicoes.push(`j.categoria_atual = $${idx++}`);
    valores.push(filtros.categoria_atual);
  }

  if (filtros.status_global) {
    condicoes.push(`j.status_global = $${idx++}`);
    valores.push(filtros.status_global);
  }

  if (filtros.id_programa) {
    condicoes.push(`EXISTS (
      SELECT 1 FROM inscricao_programa ip2
       WHERE ip2.id_jovem = j.id AND ip2.id_programa = $${idx++}
    )`);
    valores.push(filtros.id_programa);
  }

  if (filtros.ano_matricula) {
    condicoes.push(`EXISTS (
      SELECT 1 FROM inscricao_programa ip3
       WHERE ip3.id_jovem = j.id
         AND EXTRACT(YEAR FROM ip3.data_matricula) = $${idx++}
    )`);
    valores.push(filtros.ano_matricula);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT
       j.id,
       j.nome,
       j.email,
       j.telefone,
       j.cpf,
       TO_CHAR(j.data_nascimento, 'DD/MM/YYYY') AS data_nascimento,
       j.endereco,
       j.genero,
       j.renda_inicial,
       j.categoria_atual,
       j.status_global,
       TO_CHAR(j.criado_em, 'DD/MM/YYYY')       AS criado_em,
       p.nome                                    AS programa_nome,
       TO_CHAR(ip.data_matricula, 'DD/MM/YYYY')  AS data_matricula,
       ip.status_conclusao                        AS programa_status,
       e.situacao                                 AS emprego_situacao,
       e.empresa                                  AS emprego_empresa,
       e.vinculo                                  AS emprego_vinculo,
       e.renda_atual                              AS emprego_renda_atual
     FROM jovem j
     LEFT JOIN LATERAL (
       SELECT id_programa, data_matricula, status_conclusao
         FROM inscricao_programa
        WHERE id_jovem = j.id
        ORDER BY data_matricula DESC NULLS LAST
        LIMIT 1
     ) ip ON TRUE
     LEFT JOIN programa p ON p.id = ip.id_programa
     LEFT JOIN empregabilidade e
       ON e.id_jovem = j.id AND e.encerrado = 0
     ${where}
     ORDER BY j.nome`,
    valores
  );

  return gerarCsv(rows);
}

/** CSV com apenas os cabeçalhos de importação + 1 linha de exemplo. */
export function gerarTemplate(): string {
  const exemplo = {
    nome:            'Henrique Vieira',
    email:           'henrique@example.com',
    telefone:        '(11) 98765-4321',
    cpf:             '123.456.789-09',
    data_nascimento: '15/03/2002',
    endereco:        'Rua das Flores, 123, Vila Madalena, São Paulo - SP',
    genero:          'Masculino',
    renda_inicial:   '1500.00',
    categoria_atual: 'Conectado',
    status_global:   'Ativo',
  };
  return gerarCsv([exemplo]);
}
