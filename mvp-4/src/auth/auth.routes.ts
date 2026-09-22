import { Request, Response, Router } from 'express';
import { AuthRepository } from './auth.repository';
import { PerfilAutenticado, RequisicaoAutenticada } from './auth.types';
import { criarToken, duracaoSessaoMs, nomeCookieSessao } from './token';

const router = Router();
const repository = new AuthRepository();
const perfis: PerfilAutenticado[] = ['aluno', 'coordenadora', 'gestor', 'psicologa'];

const destinoPorPerfil: Record<PerfilAutenticado, string> = {
  aluno: '/aluno/index.html',
  coordenadora: '/coordenadora/dashboard.html',
  gestor: '/gestor/gestor/pages/dashboard.html',
  psicologa: '/psicologa/atendimentos.html',
};

router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const perfil = String(req.body?.perfil ?? '').toLowerCase() as PerfilAutenticado;
    const identificador = String(req.body?.identificador ?? req.body?.usuario ?? '').trim();
    const senha = String(req.body?.senha ?? '');

    if (!perfis.includes(perfil) || !identificador || !senha) {
      res.status(400).json({ error: 'Informe perfil, e-mail/RA/RM e senha.' });
      return;
    }

    const usuario = await repository.autenticar(perfil, identificador, senha);

    if (!usuario) {
      res.status(401).json({ error: 'Credenciais invalidas.' });
      return;
    }

    res.cookie(nomeCookieSessao, criarToken(usuario), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: duracaoSessaoMs,
      path: '/',
    });
    res.status(200).json({ usuario, destino: destinoPorPerfil[perfil] });
  } catch (error) {
    next(error);
  }
});

router.get('/me', (req: RequisicaoAutenticada, res: Response) => {
  if (!req.usuario) {
    res.status(401).json({ error: 'Sessao nao autenticada.' });
    return;
  }

  res.status(200).json({ usuario: req.usuario, destino: destinoPorPerfil[req.usuario.perfil] });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(nomeCookieSessao, { path: '/' });
  res.status(204).send();
});

export default router;
