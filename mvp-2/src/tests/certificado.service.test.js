// src/tests/certificado.service.test.js

jest.mock('../repositories/certificadoRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

const certificadoRepository = require('../repositories/certificadoRepository');
const certificadoService = require('../services/certificadoService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockCertificado = {
    id: 1,
    jovem_id: 10,
    nome: 'Certificado de Conclusão — Lógica',
    instituicao: 'Pulse Mais',
    carga_horaria: 40,
    data_emissao: '2026-06-01',
    url: 'https://pulsemais.org/cert/1',
    ativo: true,
    criado_em: '2026-06-01T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF026 | RN31 (sem CT enumerado no WAD §3.9 — COD-03)
describe('CertificadoService [RF026 | RN31]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o certificado criado quando os dados sao validos', async () => {
            certificadoRepository.criar.mockResolvedValue(mockCertificado);

            const resultado = await certificadoService.criar({ ...mockCertificado });

            expect(resultado).toEqual(mockCertificado);
            expect(certificadoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando jovem_id esta ausente', async () => {
            await expect(
                certificadoService.criar({ nome: 'Certificado X' })
            ).rejects.toThrow(BadRequestError);
            expect(certificadoRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando nome esta ausente', async () => {
            await expect(
                certificadoService.criar({ jovem_id: 10 })
            ).rejects.toThrow(BadRequestError);
            expect(certificadoRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando ambos os campos obrigatorios estao ausentes', async () => {
            await expect(
                certificadoService.criar({ instituicao: 'Pulse Mais' })
            ).rejects.toThrow(BadRequestError);
            expect(certificadoRepository.criar).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o certificado quando encontrado', async () => {
            certificadoRepository.buscarPorId.mockResolvedValue(mockCertificado);

            const resultado = await certificadoService.buscarPorId(1);

            expect(resultado).toEqual(mockCertificado);
            expect(certificadoRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando certificado nao existe', async () => {
            certificadoRepository.buscarPorId.mockResolvedValue(null);

            await expect(certificadoService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de certificados sem filtros', async () => {
            certificadoRepository.listarTodos.mockResolvedValue([mockCertificado]);

            const resultado = await certificadoService.listarTodos();

            expect(resultado).toEqual([mockCertificado]);
            expect(certificadoRepository.listarTodos).toHaveBeenCalledWith({});
        });

        it('converte filtro jovem_id string para numero', async () => {
            certificadoRepository.listarTodos.mockResolvedValue([mockCertificado]);

            await certificadoService.listarTodos({ jovem_id: '10' });

            expect(certificadoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 10 })
            );
        });

        it('repassa filtros sem jovem_id intactos', async () => {
            certificadoRepository.listarTodos.mockResolvedValue([mockCertificado]);

            await certificadoService.listarTodos({ instituicao: 'Pulse Mais' });

            expect(certificadoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ instituicao: 'Pulse Mais' })
            );
        });
    });

    // ------------------------------------------------------------------ atualizar
    describe('atualizar', () => {

        it('retorna o certificado atualizado quando encontrado', async () => {
            const atualizado = { ...mockCertificado, nome: 'Novo Nome' };
            certificadoRepository.buscarPorId.mockResolvedValue(mockCertificado);
            certificadoRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await certificadoService.atualizar(1, { nome: 'Novo Nome' });

            expect(resultado).toEqual(atualizado);
            expect(certificadoRepository.atualizar).toHaveBeenCalledWith(1, { nome: 'Novo Nome' });
        });

        it('lanca NotFoundError quando certificado nao existe', async () => {
            certificadoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                certificadoService.atualizar(999, { nome: 'X' })
            ).rejects.toThrow(NotFoundError);
            expect(certificadoRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui o certificado quando encontrado', async () => {
            certificadoRepository.buscarPorId.mockResolvedValue(mockCertificado);
            certificadoRepository.excluir.mockResolvedValue({ id: 1 });

            await certificadoService.excluir(1);

            expect(certificadoRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando certificado nao existe', async () => {
            certificadoRepository.buscarPorId.mockResolvedValue(null);

            await expect(certificadoService.excluir(999)).rejects.toThrow(NotFoundError);
            expect(certificadoRepository.excluir).not.toHaveBeenCalled();
        });
    });
});
