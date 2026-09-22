import crypto from 'crypto';
import { PerfilAutenticado, UsuarioAutenticado } from './auth.types';

const DURACAO_SESSAO_SEGUNDOS = 8 * 60 * 60;

interface ConteudoToken extends UsuarioAutenticado {
  exp: number;
}

const obterSegredo = (): string => {
  const segredo = process.env.AUTH_SECRET;

  if (segredo) return segredo;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET deve ser configurado em producao.');
  }

  return 'nexus-desenvolvimento-altere-este-segredo';
};

const assinar = (conteudo: string): string =>
  crypto.createHmac('sha256', obterSegredo()).update(conteudo).digest('base64url');

export const criarToken = (usuario: UsuarioAutenticado): string => {
  const conteudo: ConteudoToken = {
    ...usuario,
    exp: Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS,
  };
  const payload = Buffer.from(JSON.stringify(conteudo)).toString('base64url');
  return `${payload}.${assinar(payload)}`;
};

export const validarToken = (token?: string): UsuarioAutenticado | null => {
  if (!token) return null;

  const [payload, assinatura] = token.split('.');
  if (!payload || !assinatura) return null;

  const assinaturaEsperada = assinar(payload);
  const recebida = Buffer.from(assinatura);
  const esperada = Buffer.from(assinaturaEsperada);

  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
    return null;
  }

  try {
    const conteudo = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ConteudoToken;
    const perfis: PerfilAutenticado[] = ['aluno', 'coordenadora', 'gestor', 'psicologa'];

    if (!Number.isInteger(conteudo.id) || !perfis.includes(conteudo.perfil)) return null;
    if (!conteudo.exp || conteudo.exp <= Math.floor(Date.now() / 1000)) return null;

    return {
      id: conteudo.id,
      nome: conteudo.nome,
      email: conteudo.email,
      perfil: conteudo.perfil,
    };
  } catch {
    return null;
  }
};

export const nomeCookieSessao = 'nexus_session';
export const duracaoSessaoMs = DURACAO_SESSAO_SEGUNDOS * 1000;
