// src/tests/mentoria.service.test.js

// Aqui, mockamos explicitamente o repository para testar apenas as regras do service.
jest.mock('../repositories/mentoriaRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

// Aqui, importamos o repository mockado, o service real e os erros esperados.
const mentoriaRepository = require('../repositories/mentoriaRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const mentoriaService = require('../services/mentoriaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

jest.mock('../repositories/usuarioRepository', () => ({
    buscarPorId: jest.fn()
}));

// Aqui, definimos uma mentoria base valida para reaproveitar nos cenarios de teste.
const mockMentoria = {
    id: 1,
    jovem_id: 1,
    jovem_ids: [1],
    nome_mentoria: 'Mentoria de Front-end',
    status_mentoria: 'Agendada',
    mentor: 'Carlos',
    mentor_id: 2,
    data_mentoria: '2026-05-20',
    tempo_mentoria: '02:00',
    duracao_minutos: 120,
    carga_horaria_mentoria: 2,
    observacao_mentoria: null,
};

// Rastreabilidade (Art 11): RF004,RF006 | RN08 | CT-ME-01..16
describe('MentoriaService [RF004,RF006 | RN08 | CT-ME-01..16]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => {
        jest.clearAllMocks();
        usuarioRepository.buscarPorId.mockResolvedValue({ id: 2, perfil: 'Mentor' });
    });

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a mentoria criada quando os dados sao validos', async () => {
            mentoriaRepository.criar.mockResolvedValue(mockMentoria);

            const resultado = await mentoriaService.criar({ ...mockMentoria });

            expect(resultado).toEqual(mockMentoria);
            expect(mentoriaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                mentoriaService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas mentor_id esta ausente', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    mentor_id: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas data_mentoria esta ausente', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    data_mentoria: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas duracao_minutos esta ausente', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    duracao_minutos: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando jovem_ids esta ausente', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    jovem_ids: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando jovem_ids e um array vazio', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    jovem_ids: []
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando duracao_minutos nao e inteiro positivo', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    duracao_minutos: -30
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando status_mentoria e invalido', async () => {
            await expect(
                mentoriaService.criar({
                    ...mockMentoria,
                    status_mentoria: 'Invalido'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os status de mentoria validos', async () => {
            // Aqui, garantimos que os status aceitos pelo service continuam documentados no teste.
            const statusValidos = ['Agendada', 'Realizada', 'Cancelada'];

            for (const status_mentoria of statusValidos) {
                mentoriaRepository.criar.mockResolvedValue({ ...mockMentoria, status_mentoria });

                const resultado = await mentoriaService.criar({
                    ...mockMentoria,
                    status_mentoria
                });

                expect(resultado.status_mentoria).toBe(status_mentoria);
            }
        });

        it('repassa observacao_mentoria opcional ao repositorio', async () => {
            const mentoriaComObservacao = {
                ...mockMentoria,
                observacao_mentoria: 'Aluno evoluiu em logica de programacao'
            };
            mentoriaRepository.criar.mockResolvedValue(mentoriaComObservacao);

            await mentoriaService.criar(mentoriaComObservacao);

            expect(mentoriaRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({
                    observacao_mentoria: 'Aluno evoluiu em logica de programacao'
                })
            );
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([mockMentoria]);

            const resultado = await mentoriaService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado).toEqual([mockMentoria]);
        });

        it('retorna lista vazia quando nenhuma mentoria corresponde ao filtro', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([]);

            const resultado = await mentoriaService.listarTodos({ jovem_id: 999 });

            expect(resultado).toHaveLength(0);
        });

        it('lanca BadRequestError quando status_mentoria do filtro e invalido', async () => {
            await expect(
                mentoriaService.listarTodos({ status_mentoria: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte jovem_id string para numero antes de passar ao repositorio', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([]);

            await mentoriaService.listarTodos({ jovem_id: '1' });

            expect(mentoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('nao altera jovem_id quando ja e numero', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([mockMentoria]);

            await mentoriaService.listarTodos({ jovem_id: 1 });

            expect(mentoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('filtra mentorias por status_mentoria valido', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([mockMentoria]);

            const resultado = await mentoriaService.listarTodos({
                status_mentoria: 'Agendada'
            });

            expect(resultado).toEqual([mockMentoria]);
            expect(mentoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ status_mentoria: 'Agendada' })
            );
        });

        it('repassa filtros de mentor e data_mentoria ao repositorio', async () => {
            mentoriaRepository.listarTodos.mockResolvedValue([mockMentoria]);

            await mentoriaService.listarTodos({
                mentor: 'Carlos',
                data_mentoria: '2026-05-20'
            });

            expect(mentoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({
                    mentor: 'Carlos',
                    data_mentoria: '2026-05-20'
                })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a mentoria quando o ID existe', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);

            const resultado = await mentoriaService.buscarPorId(1);

            expect(resultado).toEqual(mockMentoria);
            expect(mentoriaRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                mentoriaService.buscarPorId(999)
            ).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna mentoria atualizada quando dados sao validos', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.atualizar.mockResolvedValue({
                ...mockMentoria,
                status_mentoria: 'Realizada'
            });

            const resultado = await mentoriaService.atualizar(1, {
                status_mentoria: 'Realizada'
            });

            expect(resultado.status_mentoria).toBe('Realizada');
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                mentoriaService.atualizar(999, {
                    status_mentoria: 'Realizada'
                })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando status_mentoria enviado no PUT e invalido', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);

            await expect(
                mentoriaService.atualizar(1, {
                    status_mentoria: 'Invalido'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os status validos na atualizacao', async () => {
            const statusValidos = ['Agendada', 'Realizada', 'Cancelada'];

            for (const status_mentoria of statusValidos) {
                mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
                mentoriaRepository.atualizar.mockResolvedValue({ ...mockMentoria, status_mentoria });

                const resultado = await mentoriaService.atualizar(1, { status_mentoria });

                expect(resultado.status_mentoria).toBe(status_mentoria);
            }
        });

        it('atualiza observacao_mentoria quando dados sao validos', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.atualizar.mockResolvedValue({
                ...mockMentoria,
                observacao_mentoria: 'Aluno evoluiu em logica de programacao'
            });

            const resultado = await mentoriaService.atualizar(1, {
                observacao_mentoria: 'Aluno evoluiu em logica de programacao'
            });

            expect(resultado.observacao_mentoria).toBe(
                'Aluno evoluiu em logica de programacao'
            );
        });

        it('atualiza data_mentoria quando dados sao validos', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.atualizar.mockResolvedValue({
                ...mockMentoria,
                data_mentoria: '2026-05-21'
            });

            const resultado = await mentoriaService.atualizar(1, {
                data_mentoria: '2026-05-21'
            });

            expect(resultado.data_mentoria).toBe('2026-05-21');
        });

        it('repassa atualizacao sem status_mentoria sem validar status', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.atualizar.mockResolvedValue({
                ...mockMentoria,
                mentor: 'Mariana'
            });

            const resultado = await mentoriaService.atualizar(1, { mentor: 'Mariana' });

            expect(resultado.mentor).toBe('Mariana');
            expect(mentoriaRepository.atualizar).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ mentor: 'Mariana' })
            );
        });

        it('retorna null quando repository nao encontra campos validos para atualizar', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.atualizar.mockResolvedValue(null);

            const resultado = await mentoriaService.atualizar(1, { campo_inexistente: 'valor' });

            expect(resultado).toBeNull();
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a mentoria quando o ID existe', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(mockMentoria);
            mentoriaRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(
                mentoriaService.excluir(1)
            ).resolves.not.toThrow();
            expect(mentoriaRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError ao tentar excluir ID inexistente', async () => {
            mentoriaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                mentoriaService.excluir(999)
            ).rejects.toThrow(NotFoundError);
        });
    });
});
