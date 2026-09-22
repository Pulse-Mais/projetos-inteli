import { criarToken, validarToken } from '../../auth/token';

describe('sessao autenticada', () => {
  const usuario = {
    id: 101,
    nome: 'Aluno Teste',
    email: 'aluno@example.com',
    perfil: 'aluno' as const,
  };

  it('valida um token assinado sem alterar a identidade', () => {
    expect(validarToken(criarToken(usuario))).toEqual(usuario);
  });

  it('rejeita token adulterado', () => {
    const token = criarToken(usuario);
    const adulterado = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    expect(validarToken(adulterado)).toBeNull();
  });
});
