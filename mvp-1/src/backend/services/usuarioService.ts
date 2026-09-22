import * as repo from '../repositories/usuarioRepository';
import { CreateUsuarioData } from '../repositories/usuarioRepository';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/AppError';

/** Lista todos os usuários sem filtro. */
export async function listarUsuarios() {
  return repo.findAll();
}

/**
 * Busca um usuário pelo ID, incluindo dados de coordenador e/ou mentor se aplicável.
 * @throws {NotFoundError} se não encontrado
 */
export async function buscarUsuario(id: number) {
  const usuario = await repo.findById(id);
  if (!usuario) throw new NotFoundError(`Usuário com id ${id} não encontrado`);
  return usuario;
}

/**
 * Cria um novo usuário.
 * RN01: CPF e e-mail devem ser únicos no sistema.
 * @throws {ConflictError} se CPF ou e-mail já estiverem cadastrados
 */
export async function criarUsuario(data: CreateUsuarioData) {
  // RN01: CPF deve ser único
  const cpfExistente = await repo.findByCpf(data.cpf);
  if (cpfExistente) {
    throw new ConflictError('CPF já cadastrado no sistema');  // linha 18
  }
  // Email também deve ser único
  const emailExistente = await repo.findByEmail(data.email);
  if (emailExistente) {
    throw new ConflictError('E-mail já cadastrado no sistema');  // linha 23
  }
  return repo.create(data);
}

/**
 * Atualiza dados de um usuário, incluindo opcionalmente campos específicos de coordenador ou mentor.
 * Campos de coordenador (area, telefone, cargo, data_admissao, cidade/estado_nascimento)
 * são persistidos em tabela separada via repo.updateCoord().
 * Campos de mentor (especialidade, tipo_vinculo, disponibilidade)
 * são persistidos em tabela separada via repo.updateMentor().
 * @throws {BadRequestError} se CPF ou e-mail já pertencerem a outro usuário
 * @throws {NotFoundError} se não encontrado
 */
export async function atualizarUsuario(
  id: number,
  data: Parameters<typeof repo.update>[1] & {
    area?: string;
    telefone?: string;
    cargo?: string;
    data_admissao?: string;
    cidade_nascimento?: string;
    estado_nascimento?: string;
    especialidade?: string;
    tipo_vinculo?: string;
    disponibilidade?: string;
  }
) {
  const {
    area, telefone, cargo, data_admissao, cidade_nascimento, estado_nascimento,
    especialidade, tipo_vinculo, disponibilidade,
    ...usuarioData
  } = data as any;

  if (usuarioData.cpf !== undefined && usuarioData.cpf !== '') {
    const cpfExistente = await repo.findByCpf(usuarioData.cpf);
    if (cpfExistente && cpfExistente.id_usuario !== id) {
      throw new BadRequestError('CPF já cadastrado no sistema');
    }
  }
  if (usuarioData.email !== undefined && usuarioData.email !== '') {
    const emailExistente = await repo.findByEmail(usuarioData.email);
    if (emailExistente && emailExistente.id_usuario !== id) {
      throw new BadRequestError('E-mail já cadastrado no sistema');
    }
  }

  if (Object.keys(usuarioData).length > 0) {
    const usuario = await repo.update(id, usuarioData);
    if (!usuario) throw new NotFoundError(`Usuário com id ${id} não encontrado`);
  }

  // Persiste campos específicos de coordenador
  const coordFields = { area, telefone, cargo, data_admissao, cidade_nascimento, estado_nascimento };
  const coordUpdates = Object.fromEntries(Object.entries(coordFields).filter(([, v]) => v !== undefined));
  if (Object.keys(coordUpdates).length > 0) {
    await repo.updateCoord(id, coordUpdates);
  }

  // Persiste campos específicos de mentor
  const mentorFields = { especialidade, tipo_vinculo, disponibilidade };
  const mentorUpdates = Object.fromEntries(Object.entries(mentorFields).filter(([, v]) => v !== undefined));
  if (Object.keys(mentorUpdates).length > 0) {
    await repo.updateMentor(id, mentorUpdates);
  }

  return repo.findById(id);
}

/**
 * Remove fisicamente um usuário.
 * @throws {NotFoundError} se não encontrado
 */
export async function deletarUsuario(id: number) {
  const removido = await repo.remove(id);
  if (!removido) throw new NotFoundError(`Usuário com id ${id} não encontrado`);
}

/** Busca um usuário pelo e-mail (case-insensitive). Retorna null se não encontrado. */
export async function buscarPorEmail(email: string) {
  return repo.findByEmail(email);
}

/**
 * Autentica um coordenador pelo e-mail usando INNER JOIN com a tabela `coordenador`.
 * Retorna null se o e-mail não existir ou não pertencer a um coordenador.
 */
export async function loginCoordenador(email: string) {
  const usuario = await repo.findCoordByEmail(email.toLowerCase().trim());
  return usuario;
}

/** Busca um usuário pelo CPF (match exato). Retorna null se não encontrado. */
export async function buscarPorCpf(cpf: string) {
  return repo.findByCpf(cpf);
}

/**
 * Atualiza dados pessoais de um usuário (nome, email, cpf, senha).
 * Unicidade de CPF/e-mail deve ser verificada pelo serviço chamador antes desta chamada.
 * @throws {NotFoundError} se não encontrado
 */
export async function atualizarDadosPessoais(
  id: number,
  data: Parameters<typeof repo.update>[1],
) {
  const atualizado = await repo.update(id, data);
  if (!atualizado) throw new NotFoundError(`Usuário com id ${id} não encontrado`);
  return atualizado;
}
