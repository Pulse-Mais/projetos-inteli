import pool from '../database/connection';
import { AlunoAtendido, Psicologo, Prontuario, RegistrarProntuario, AtualizarProntuario, FiltrosAlunosAtendidos } from '../database/models/psicologo.model';

export class PsicologoRepository {
  async buscarRmPsi(rm: number): Promise<Psicologo | null> {
    const result = await pool.query<Psicologo>(
      'SELECT rm, nome, cargo, email FROM psicologo WHERE rm = $1',
      [rm],
    );

    return result.rows[0] ?? null;
  }

  async buscarAlunosPorRm(rm: number, filtros: FiltrosAlunosAtendidos = {}): Promise<AlunoAtendido[]> {
    const valores: (number | string | boolean)[] = [];
    const condicoes = ['1 = 1'];
    const status = filtros.status ?? 'ALL';

    void rm;

    if (filtros.busca?.trim()) {
      valores.push(`%${filtros.busca.trim()}%`);
      condicoes.push(`(aluno.nome ILIKE $${valores.length} OR CAST(aluno.ra AS TEXT) ILIKE $${valores.length})`);
    }

    if (filtros.id_turma !== undefined) {
      valores.push(filtros.id_turma);
      condicoes.push(`aluno.id_turma = $${valores.length}`);
    }

    if (status === 'ACTIVE') {
      condicoes.push(`LOWER(aluno.status::text) NOT IN (
        'false',
        'f',
        '0',
        'inactive',
        'inativo',
        'inativa',
        'desativado',
        'desativada'
      )`);
    }

    if (status === 'INACTIVE') {
      condicoes.push(`LOWER(aluno.status::text) IN (
        'false',
        'f',
        '0',
        'inactive',
        'inativo',
        'inativa',
        'desativado',
        'desativada'
      )`);
    }

    const result = await pool.query<AlunoAtendido>(
      `SELECT aluno.ra,
              aluno.nome,
              aluno.status,
              aluno.id_turma,
              turma.nome_turma
       FROM aluno
       LEFT JOIN turma ON turma.id_turma = aluno.id_turma
       WHERE ${condicoes.join(' AND ')}
       ORDER BY aluno.nome ASC, aluno.ra ASC`,
      valores,
    );

    return result.rows;
  }

  async registrarProntuario(rm: number, ra: number, dados: RegistrarProntuario): Promise<void> {
    await pool.query(
      `INSERT INTO relatorio (
        info_simplificada,
        observacoes,
        data,
        id_aluno,
        id_psicologo
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        dados.info_simplificada,
        dados.observacoes ?? '',
        dados.data,
        ra,
        rm,
      ],
    )
  }

  async buscarProntuarios(rm: number, ra: number): Promise<Prontuario[]> {
    const result = await pool.query<Prontuario>(
      `SELECT id_relatorio, info_simplificada, observacoes, data
       FROM relatorio
       WHERE id_psicologo = $1 AND id_aluno = $2
       ORDER BY data ASC, id_relatorio ASC`,
      [rm, ra],
    );

    return result.rows;
  }

  async atualizarProntuario(
    rm: number,
    ra: number,
    idRelatorio: number,
    dados: AtualizarProntuario,
  ): Promise<boolean> {
    const camposPermitidos: (keyof AtualizarProntuario)[] = ['info_simplificada', 'observacoes'];
    const campos = camposPermitidos.filter(campo => dados[campo] !== undefined);

    if (campos.length === 0) {
      return false;
    }

    const sets = campos.map((campo, index) => `${String(campo)} = $${index + 1}`).join(', ');
    const valores = campos.map(campo => dados[campo]);

    valores.push(rm as any, ra as any, idRelatorio as any);

    const result = await pool.query(
      `UPDATE relatorio SET ${sets}
       WHERE id_psicologo = $${valores.length - 2}
       AND id_aluno = $${valores.length - 1}
       AND id_relatorio = $${valores.length}`,
      valores,
    );

    return (result.rowCount ?? 0) > 0;
  }

  async atualizarStatusAtendimento(rm: number, ra: number, status: boolean): Promise<AlunoAtendido | null> {
    void rm;

    const result = await pool.query<AlunoAtendido>(
      `UPDATE aluno
       SET status = $2
       WHERE ra = $1
       RETURNING ra, nome, status, id_turma`,
      [ra, String(status)],
    );

    return result.rows[0] ?? null;
  }
}
