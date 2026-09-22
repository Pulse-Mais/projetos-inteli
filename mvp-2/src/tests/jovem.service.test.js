// src/tests/jovem.service.test.js

jest.mock('../repositories/jovemRepository');

const jovemRepository = require('../repositories/jovemRepository');
const jovemService    = require('../services/jovemService');
const { BadRequestError, ConflictError, NotFoundError, ForbiddenError } = require('../errors/AppError');

const mockJovem = {
    id:                      1,
    nome:                    'Maria Silva',
    cpf:                     '52998224725',
    email:                   'maria@email.com',
    data_nascimento:         '2000-01-01',
    status_jornada:          'Conectado',
    bairro:                  'Cidade Tiradentes',
    cidade:                  'São Paulo',
    estado:                  'SP',
    tipo_moradia:            'Alugada',
    multiplicador:           false,
    status_empregabilidade:  'Em_formacao',
    ativo:                   true,
};

// Rastreabilidade (Art 11): RF001 (CRUD jovens) | RN01,RN02,RN03,RN04,RN13,RN19 | CT-JV-01..18
describe('JovemService [RF001 | RN01,RN02,RN03,RN04,RN13,RN19 | CT-JV-01..18]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o jovem criado quando os dados são válidos', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue(null);
            jovemRepository.criar.mockResolvedValue(mockJovem);

            const resultado = await jovemService.criar({ ...mockJovem });

            expect(resultado).toEqual(mockJovem);
            expect(jovemRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('[CT-JV-03][RN03] lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                jovemService.criar({ nome: 'Maria' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-JV-05][RN19] lança BadRequestError quando CPF tem dígito verificador inválido', async () => {
            await expect(
                jovemService.criar({ ...mockJovem, cpf: '11111111111' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-JV-07][RN19] lança BadRequestError quando e-mail tem formato inválido', async () => {
            await expect(
                jovemService.criar({ ...mockJovem, cpf: mockJovem.cpf, email: 'email-invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-JV-01][RN01] lança ConflictError quando CPF já está cadastrado', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue({ id: 99 });
            jovemRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                jovemService.criar({ ...mockJovem })
            ).rejects.toThrow(ConflictError);
        });

        it('[CT-JV-02][RN02] lança ConflictError quando e-mail já está cadastrado', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue({ id: 99 });

            await expect(
                jovemService.criar({ ...mockJovem })
            ).rejects.toThrow(ConflictError);
        });

        it('[CT-JV-04][RN04] lança BadRequestError quando status_jornada é inválido', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                jovemService.criar({ ...mockJovem, status_jornada: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando tipo_moradia é inválido', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                jovemService.criar({ ...mockJovem, tipo_moradia: 'Mansao' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando status_empregabilidade é inválido', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                jovemService.criar({ ...mockJovem, status_empregabilidade: 'Aposentado' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-JV-06][RN04] aceita todos os status_jornada válidos', async () => {
            const statusValidos = [
                'Conectado', 'Capacitado', 'Transformado',
                'Conectado_Capacitado', 'Capacitado_Transformado', 'Conectado_Capacitado_Transformado'
            ];

            for (const status_jornada of statusValidos) {
                jovemRepository.buscarPorCpf.mockResolvedValue(null);
                jovemRepository.buscarPorEmail.mockResolvedValue(null);
                jovemRepository.criar.mockResolvedValue({ ...mockJovem, status_jornada });

                const resultado = await jovemService.criar({ ...mockJovem, status_jornada });
                expect(resultado.status_jornada).toBe(status_jornada);
            }
        });

        it('cria jovem com campos de endereço e perfil preenchidos', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
            jovemRepository.buscarPorEmail.mockResolvedValue(null);
            jovemRepository.criar.mockResolvedValue(mockJovem);

            const resultado = await jovemService.criar({ ...mockJovem });

            expect(resultado.bairro).toBe('Cidade Tiradentes');
            expect(resultado.cidade).toBe('São Paulo');
            expect(resultado.tipo_moradia).toBe('Alugada');
            expect(resultado.status_empregabilidade).toBe('Em_formacao');
            expect(resultado.multiplicador).toBe(false);
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de jovens sem filtros', async () => {
            jovemRepository.listarTodos.mockResolvedValue([mockJovem]);

            const resultado = await jovemService.listarTodos();
            expect(resultado).toHaveLength(1);
        });

        it('lança BadRequestError quando status_jornada do filtro é inválido', async () => {
            await expect(
                jovemService.listarTodos({ status_jornada: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando status_empregabilidade do filtro é inválido', async () => {
            await expect(
                jovemService.listarTodos({ status_empregabilidade: 'Aposentado' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte ativo string "true" para boolean true antes de passar ao repositório', async () => {
            jovemRepository.listarTodos.mockResolvedValue([]);

            await jovemService.listarTodos({ ativo: 'true' });
            expect(jovemRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('converte ativo string "false" para boolean false antes de passar ao repositório', async () => {
            jovemRepository.listarTodos.mockResolvedValue([]);

            await jovemService.listarTodos({ ativo: 'false' });
            expect(jovemRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('repassa ativo boolean true ao repositório sem conversão', async () => {
            jovemRepository.listarTodos.mockResolvedValue([mockJovem]);

            await jovemService.listarTodos({ ativo: true });
            expect(jovemRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('filtra por multiplicador corretamente', async () => {
            jovemRepository.listarTodos.mockResolvedValue([]);

            await jovemService.listarTodos({ multiplicador: 'true' });
            expect(jovemRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ multiplicador: 'true' })
            );
        });

        it('filtra por status_empregabilidade válido corretamente', async () => {
            jovemRepository.listarTodos.mockResolvedValue([mockJovem]);

            const resultado = await jovemService.listarTodos({ status_empregabilidade: 'Empregado' });
            expect(resultado).toHaveLength(1);
            expect(jovemRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ status_empregabilidade: 'Empregado' })
            );
        });

        it('retorna lista vazia quando nenhum jovem corresponde ao filtro', async () => {
            jovemRepository.listarTodos.mockResolvedValue([]);

            const resultado = await jovemService.listarTodos({ status_jornada: 'Transformado' });
            expect(resultado).toHaveLength(0);
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        const usuarioGestor = { id: 10, perfil: 'GestaoGeral', jovem_id: null };
        const usuarioAluno  = { id: 20, perfil: 'Aluno', jovem_id: 1 };

        it('retorna o jovem quando o ID existe (perfil gestor)', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            const resultado = await jovemService.buscarPorId(1, usuarioGestor);
            expect(resultado).toEqual(mockJovem);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(jovemService.buscarPorId(999, usuarioGestor)).rejects.toThrow(NotFoundError);
        });

        it('retorna o jovem quando aluno acessa seus próprios dados', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            const resultado = await jovemService.buscarPorId(1, usuarioAluno);
            expect(resultado).toEqual(mockJovem);
        });

        it('lança ForbiddenError quando aluno tenta acessar dados de outro jovem', async () => {
            await expect(jovemService.buscarPorId(99, usuarioAluno)).rejects.toThrow(ForbiddenError);
            expect(jovemRepository.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna jovem atualizado quando dados são válidos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.atualizar.mockResolvedValue({ ...mockJovem, nome: 'Maria Souza' });

            const resultado = await jovemService.atualizar(1, { nome: 'Maria Souza' });
            expect(resultado.nome).toBe('Maria Souza');
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                jovemService.atualizar(999, { nome: 'Qualquer' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando CPF enviado no PUT é inválido', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            await expect(
                jovemService.atualizar(1, { cpf: '11111111111' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-JV-08][RN01] lança ConflictError quando CPF válido pertence a outro jovem', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.buscarPorCpf.mockResolvedValue({ id: 99 });

            await expect(
                jovemService.atualizar(1, { cpf: '52998224725' })
            ).rejects.toThrow(ConflictError);
        });

        it('lança BadRequestError quando e-mail enviado no PUT é inválido', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            await expect(
                jovemService.atualizar(1, { email: 'invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança ConflictError quando e-mail válido pertence a outro jovem', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.buscarPorEmail.mockResolvedValue({ id: 99 });

            await expect(
                jovemService.atualizar(1, { email: 'outro@email.com' })
            ).rejects.toThrow(ConflictError);
        });

        it('lança BadRequestError quando status_jornada enviado no PUT é inválido', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            await expect(
                jovemService.atualizar(1, { status_jornada: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando tipo_moradia enviado no PUT é inválido', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            await expect(
                jovemService.atualizar(1, { tipo_moradia: 'Mansao' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando status_empregabilidade enviado no PUT é inválido', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);

            await expect(
                jovemService.atualizar(1, { status_empregabilidade: 'Aposentado' })
            ).rejects.toThrow(BadRequestError);
        });

        it('atualiza campos de endereço corretamente', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.atualizar.mockResolvedValue({ ...mockJovem, cidade: 'Campinas', estado: 'SP' });

            const resultado = await jovemService.atualizar(1, { cidade: 'Campinas', estado: 'SP' });
            expect(resultado.cidade).toBe('Campinas');
        });

        it('atualiza multiplicador para true corretamente', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.atualizar.mockResolvedValue({ ...mockJovem, multiplicador: true });

            const resultado = await jovemService.atualizar(1, { multiplicador: true });
            expect(resultado.multiplicador).toBe(true);
        });
    });

    // ---------------------------------------------------------------- arquivar
    describe('arquivar', () => {

        it('[CT-JV-09][RN13] persiste ativo: false e retorna o jovem atualizado', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            jovemRepository.arquivar.mockResolvedValue({ ...mockJovem, ativo: false });

            const resultado = await jovemService.arquivar(1);
            expect(resultado.ativo).toBe(false);
        });

        it('lança NotFoundError ao tentar arquivar ID inexistente', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(jovemService.arquivar(999)).rejects.toThrow(NotFoundError);
        });
    });
});
