import { NextFunction, Request, Response } from 'express';
import { RequisicaoAutenticada, UsuarioAutenticado } from './auth.types';
import { nomeCookieSessao, validarToken } from './token';

const lerCookies = (cabecalho?: string): Record<string, string> =>
  Object.fromEntries((cabecalho ?? '').split(';').map(item => item.trim()).filter(Boolean).map(item => {
    const separador = item.indexOf('=');
    return [decodeURIComponent(item.slice(0, separador)), decodeURIComponent(item.slice(separador + 1))];
  }));

export const identificarSessao = (req: RequisicaoAutenticada, _res: Response, next: NextFunction): void => {
  const token = lerCookies(req.get('cookie'))[nomeCookieSessao];
  req.usuario = validarToken(token) ?? undefined;
  next();
};

export const exigirAutenticacao = (req: RequisicaoAutenticada, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test' && process.env.AUTH_TEST_BYPASS === 'true') {
    next();
    return;
  }

  if (!req.usuario) {
    res.status(401).json({ error: 'Autenticacao necessaria.' });
    return;
  }

  next();
};

const idDaRota = (caminho: string, expressao: RegExp): number | null => {
  const valor = caminho.match(expressao)?.[1];
  return valor ? Number(valor) : null;
};

const permitidoParaAluno = (req: Request, usuario: UsuarioAutenticado): boolean => {
  const aluno = idDaRota(req.path, /^\/alunos\/(\d+)(?:\/|$)/)
    ?? idDaRota(req.path, /^\/aluno\/(\d+)(?:\/|$)/);

  if (aluno !== null) return aluno === usuario.id;
  return req.method === 'GET' && /^\/coordenadora\/\d+\/eventos$/.test(req.path);
};

export const autorizarRota = (req: RequisicaoAutenticada, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test' && process.env.AUTH_TEST_BYPASS === 'true' && !req.usuario) {
    next();
    return;
  }

  const usuario = req.usuario;
  if (!usuario) {
    res.status(401).json({ error: 'Autenticacao necessaria.' });
    return;
  }

  let permitido = false;

  if (usuario.perfil === 'aluno') {
    permitido = permitidoParaAluno(req, usuario);
  } else if (usuario.perfil === 'coordenadora') {
    const rm = idDaRota(req.path, /^\/coordenadora\/(\d+)(?:\/|$)/);
    permitido = rm === null || rm === usuario.id;
    permitido = permitido && !req.path.startsWith('/gestor') && !req.path.startsWith('/psicolog');
  } else if (usuario.perfil === 'gestor') {
    const rm = idDaRota(req.path, /^\/gestor\/(\d+)(?:\/|$)/);
    permitido = (rm === null || rm === usuario.id) && !req.path.startsWith('/coordenadora') && !req.path.startsWith('/psicolog');
  } else if (usuario.perfil === 'psicologa') {
    const rm = idDaRota(req.path, /^\/psicologa?\/(\d+)(?:\/|$)/);
    const rmQuery = req.path.startsWith('/psicologo/alunos/') ? Number(req.query.rm) : null;
    const podeListarTurmas = req.method === 'GET' && req.path === '/gestao/turmas';
    permitido = podeListarTurmas || (
      req.path.startsWith('/psicolog')
      && (rm === null || rm === usuario.id)
      && (rmQuery === null || rmQuery === usuario.id)
    );
  }

  if (!permitido) {
    res.status(403).json({ error: 'Acesso negado para este usuario ou perfil.' });
    return;
  }

  if (req.method === 'POST' && /^\/alunos\/\d+\/anotacoes$/.test(req.path)) {
    req.body.nome_autor = req.body.nome_autor || usuario.nome;
  }

  if (req.path.startsWith('/gestor/comunicados') && req.method === 'POST') {
    req.body.enviado_por = usuario.id;
  }

  next();
};

export const protegerPaginaHtml = (req: RequisicaoAutenticada, res: Response, next: NextFunction): void => {
  const entradaDePasta = /^\/(aluno|coordenadora|gestor|psicologa)\/?$/.test(req.path);

  if (
    (!req.path.endsWith('.html') && !entradaDePasta)
    || req.path === '/login.html'
    || req.path === '/login-standby.html'
    || req.path === '/login/standby.html'
  ) {
    next();
    return;
  }

  if (!req.usuario) {
    res.redirect('/login.html');
    return;
  }

  const pastaPorPerfil: Record<UsuarioAutenticado['perfil'], string> = {
    aluno: '/aluno/',
    coordenadora: '/coordenadora/',
    gestor: '/gestor/',
    psicologa: '/psicologa/',
  };

  if (!req.path.startsWith(pastaPorPerfil[req.usuario.perfil])) {
    res.status(403).send('Acesso negado para este perfil.');
    return;
  }

  next();
};
