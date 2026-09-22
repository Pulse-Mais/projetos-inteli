import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import alunoRoutes from './routes/aluno.routes';
import psicologoRoutes from './routes/psicologo.routes';
import empregoRoutes from './routes/emprego.routes';
import pool from './database/connection';
import coordenadoraRoutes from './routes/coordenadora.routes';
import gestorRoutes from './routes/gestor.routes';
import turmasRoutes from './routes/turmasRoutes';
import jornadaRoutes from './routes/jornadaRoutes';
import frequenciaRoutes from './routes/frequenciaRoutes';
import dashboardRoutes from './routes/dashboard.routes';
import anotacaoRoutes from './routes/anotacao.routes';
import authRoutes from './auth/auth.routes';
import { rotaNaoEncontrada, tratadorGlobalDeErros } from './middlewares/errorHandler';
import {
    autorizarRota,
    exigirAutenticacao,
    identificarSessao,
    protegerPaginaHtml,
} from './auth/auth.middleware';

interface ErroBanco {
    message?: string;
    code?: string;
    table?: string;
    column?: string;
    detail?: string;
}

const app = express();
const porta = Number(process.env.PORT || process.env.SERVER_PORT) || 3000;
const diretorioView = path.resolve(process.cwd(), 'view');
const diretorioAssets = path.resolve(process.cwd(), '..', 'assets');

const valorConfigBancoValido = (valor?: string): boolean =>
    Boolean(valor && !valor.includes('SUA_SENHA_DO_SUPABASE'));

const bancoConfigurado = (): boolean =>
    valorConfigBancoValido(process.env.DATABASE_URL) ||
    Boolean(
        process.env.DB_HOST &&
        process.env.DB_PORT &&
        process.env.DB_NAME &&
        process.env.DB_USER &&
        valorConfigBancoValido(process.env.DB_PASSWORD),
    );

const origensPermitidas = new Set([
    process.env.CORS_ORIGIN,
    'http://localhost:3003',
    'http://localhost:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
].filter((origem): origem is string => Boolean(origem)));

app.use(cors({
    credentials: true,
    origin(origin, callback) {
        if (!origin || origensPermitidas.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Origem nao permitida pelo CORS.'));
    },
}));
app.use(express.json({ limit: '5mb' }));
app.use(identificarSessao);
app.use('/auth', authRoutes);
app.use('/assets', express.static(diretorioAssets));
app.get('/login.html', (_req: Request, res: Response) => {
    res.sendFile('index.html', { root: path.join(diretorioView, 'login') });
});
app.get('/login-standby.html', (_req: Request, res: Response) => {
    res.redirect('/login/standby.html');
});
app.get('/', (_req: Request, res: Response) => {
    res.redirect('/login.html');
});
app.use(protegerPaginaHtml);
app.use(express.static(diretorioView));

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            message: 'Servidor Pulse Mais rodando',
            timestamp: new Date(),
        },
    });
});

app.get('/health/db', async (_req: Request, res: Response, next: NextFunction) => {
    if (!bancoConfigurado()) {
        res.status(503).json({
            success: false,
            error: 'Banco de dados nao configurado.',
            ...(process.env.NODE_ENV !== 'production' && {
                debug: {
                    message: 'Crie um arquivo .env com DATABASE_URL ou substitua SUA_SENHA_DO_SUPABASE pela senha real do banco.',
                },
            }),
        });
        return;
    }

    try {
        const conexao = await pool.query(
            'SELECT current_database() AS database, current_user AS usuario',
        );
        const colunas = await pool.query(
            `SELECT table_name, column_name, data_type
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name IN ('aluno', 'empregabilidade')
             ORDER BY table_name, ordinal_position`,
        );
        const aluno = await pool.query(
            'SELECT ra, nome, status FROM aluno WHERE ra = $1',
            [101],
        );

        const temDataEncerramento = colunas.rows.some(
            coluna =>
                coluna.table_name === 'empregabilidade' &&
                coluna.column_name === 'data_encerramento',
        );
        const colunaStatus = colunas.rows.find(
            coluna => coluna.table_name === 'aluno' && coluna.column_name === 'status',
        );

        res.status(200).json({
            success: true,
            data: {
                status: 'ok',
                conexao: conexao.rows[0],
                verificacoes: {
                    tabelaAlunoExiste: colunas.rows.some(coluna => coluna.table_name === 'aluno'),
                    tabelaEmpregabilidadeExiste: colunas.rows.some(
                        coluna => coluna.table_name === 'empregabilidade',
                    ),
                    empregabilidadeTemDataEncerramento: temDataEncerramento,
                    alunoStatusTipo: colunaStatus?.data_type ?? null,
                    aluno101Existe: aluno.rows.length > 0,
                },
                aluno101: aluno.rows[0] ?? null,
            },
        });
    } catch (error: unknown) {
        next(error);
    }
});

app.use(exigirAutenticacao);
app.use(autorizarRota);

app.use('/', alunoRoutes);
app.use('/', turmasRoutes);
app.use('/', jornadaRoutes);
app.use('/', frequenciaRoutes);
app.use('/', psicologoRoutes);
app.use('/', coordenadoraRoutes);
app.use('/', gestorRoutes);
app.use('/', dashboardRoutes);
app.use('/', anotacaoRoutes);
app.use('/gestao', empregoRoutes);

app.use(rotaNaoEncontrada);
app.use(tratadorGlobalDeErros);

if (require.main === module) {
    app.listen(porta, () => {
        console.log(`Servidor rodando na porta ${porta}`);
    });
}

export default app;
