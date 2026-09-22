import { Request, Response } from 'express'
import { PsicologoService } from '../services/psicologo.service'

function bancoConfigurado(): boolean {
    if (process.env.NODE_ENV === 'test') {
        return true
    }

    const databaseUrl = process.env.DATABASE_URL
    const senhaBanco = process.env.DB_PASSWORD

    return Boolean(
        (databaseUrl && !databaseUrl.includes('SUA_SENHA_DO_SUPABASE')) ||
        (
            process.env.DB_HOST &&
            process.env.DB_PORT &&
            process.env.DB_NAME &&
            process.env.DB_USER &&
            senhaBanco &&
            !senhaBanco.includes('SUA_SENHA_DO_SUPABASE')
        ),
    )
}

function responderErroBanco(res: Response): Response | null {
    if (bancoConfigurado()) {
        return null
    }

    return res.status(503).json({
        error: 'Banco de dados nao configurado. Substitua SUA_SENHA_DO_SUPABASE no arquivo .env pela senha real.',
    })
}

function normalizarStatusBooleano(status: unknown): boolean | null {
    if (typeof status === 'boolean') {
        return status
    }

    if (typeof status !== 'string') {
        return null
    }

    const chave = status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    if (['active', 'ativo', 'true', '1'].includes(chave)) {
        return true
    }

    if (['inactive', 'inativo', 'false', '0'].includes(chave)) {
        return false
    }

    return null
}

function obterTextoQuery(valor: unknown): string | undefined {
    return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined
}

function normalizarStatusAluno(status: unknown): 'ACTIVE' | 'INACTIVE' | 'ALL' | null {
    if (status === undefined || status === null || status === '') {
        return 'ALL'
    }

    if (typeof status !== 'string') {
        return null
    }

    const statusNormalizado = status.trim().toUpperCase()

    if (['ACTIVE', 'INACTIVE', 'ALL'].includes(statusNormalizado)) {
        return statusNormalizado as 'ACTIVE' | 'INACTIVE' | 'ALL'
    }

    return null
}

function obterIdTurma(valor: unknown): number | undefined | null {
    if (valor === undefined || valor === null || valor === '') {
        return undefined
    }

    const idTurma = Number(valor)
    return Number.isInteger(idTurma) && idTurma > 0 ? idTurma : null
}

export class PsicologoController {
    constructor(private readonly psicologoService: PsicologoService) { }
    async buscarRmPsi(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)

            if (!Number.isInteger(rm) || rm <= 0) {
                return res.status(400).json({ error: 'RM invalido.' })
            }

            const psicologo = await this.psicologoService.buscarRmPsi(rm)

            if (!psicologo) {
                return res.status(404).json({ error: 'Psicóloga não encontrada.' })
            }

            return res.status(200).json(psicologo)
        }
        catch {
            return res.status(500).json({ error: 'Erro interno ao buscar psicólogo.' })
        }
    }

    async buscarAlunos(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)

            if (!Number.isInteger(rm) || rm <= 0) {
                return res.status(400).json({ error: 'RM invalido.' })
            }

            const status = normalizarStatusAluno(req.query.status)
            const idTurma = obterIdTurma(req.query.id_turma ?? req.query.turma)

            if (!status) {
                return res.status(400).json({ error: 'Status invalido. Use ACTIVE, INACTIVE ou ALL.' })
            }

            if (idTurma === null) {
                return res.status(400).json({ error: 'id_turma invalido.' })
            }

            const filtros = {
                busca: obterTextoQuery(req.query.busca ?? req.query.nome ?? req.query.name),
                id_turma: idTurma,
                status,
            }

            const alunos = await this.psicologoService.buscarAlunosPorRm(rm, filtros)

            return res.status(200).json(alunos)
        }
        catch {
            const erroBanco = responderErroBanco(res)
            if (erroBanco) return erroBanco

            return res.status(500).json({ error: 'Erro interno ao buscar alunos.' })
        }
    }

    async registrarProntuario(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)
            const ra = Number(req.params.ra)
            const { info_simplificada, observacoes, data } = req.body ?? {}

            if (!Number.isInteger(rm) || rm <= 0 || !Number.isInteger(ra) || ra <= 0) {
                return res.status(400).json({ error: 'Parametros invalidos.' })
            }

            if (!info_simplificada || !data) {
                return res.status(400).json({ error: 'Campos obrigatórios ausentes.' })
            }

            await this.psicologoService.registrarProntuario(rm, ra, {
                info_simplificada,
                observacoes,
                data,
            })

            return res.status(201).json({
                message: 'Prontuário registrado com sucesso.',
            })
        }

        catch {
            const erroBanco = responderErroBanco(res)
            if (erroBanco) return erroBanco

            return res.status(500).json({
                error: 'Erro interno ao registrar prontuário.',
            })
        }
    }

    async buscarProntuarios(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)
            const ra = Number(req.params.ra)

            if (!Number.isInteger(rm) || rm <= 0 || !Number.isInteger(ra) || ra <= 0) {
                return res.status(400).json({ error: 'Parametros invalidos.' })
            }

            const prontuarios = await this.psicologoService.buscarProntuarios(rm, ra)

            if (prontuarios.length === 0) {
                return res.status(404).json({ error: 'Nenhum prontuário encontrado.' })
            }

            return res.status(200).json(prontuarios)
        }
        catch {
            const erroBanco = responderErroBanco(res)
            if (erroBanco) return erroBanco

            return res.status(500).json({
                error: 'Erro interno ao buscar prontuários.',
            })
        }
    }

    async atualizarProntuario(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)
            const ra = Number(req.params.ra)
            const idRelatorio = Number(req.params.id_relatorio)
            const dados = req.body ?? {}

            if (!Number.isInteger(rm) || rm <= 0 || !Number.isInteger(ra) || ra <= 0 || !Number.isInteger(idRelatorio) || idRelatorio <= 0) {
                return res.status(400).json({ error: 'Parametros invalidos.' })
            }

            const atualizado = await this.psicologoService.atualizarProntuario(
                rm,
                ra,
                idRelatorio,
                dados,
            )

            if (!atualizado) {
                return res.status(404).json({ error: 'Prontuário não encontrado.' })
            }

            return res.status(200).json({
                message: 'Prontuário atualizado com sucesso.',
            })
        }
        catch {
            return res.status(500).json({
                error: 'Erro interno ao atualizar prontuário.',
            })
        }
    }

    async atualizarStatusAtendimento(req: Request, res: Response): Promise<Response> {
        try {
            const rm = Number(req.params.rm)
            const ra = Number(req.params.ra)
            const status = normalizarStatusBooleano(req.body?.status)

            if (!Number.isInteger(rm) || rm <= 0 || !Number.isInteger(ra) || ra <= 0) {
                return res.status(400).json({ error: 'Parametros invalidos.' })
            }

            if (status === null) {
                return res.status(400).json({ error: 'Status invalido. Use ACTIVE ou INACTIVE.' })
            }

            const aluno = await this.psicologoService.atualizarStatusAtendimento(rm, ra, status)

            if (!aluno) {
                return res.status(404).json({ error: 'Atendimento nao encontrado para esta psicologa.' })
            }

            return res.status(200).json(aluno)
        }
        catch {
            return res.status(500).json({
                error: 'Erro interno ao atualizar status do atendimento.',
            })
        }
    }
}
