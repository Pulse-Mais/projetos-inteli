    import { Router } from 'express';
    import { asyncHandler } from '../helpers/asyncHandler';
    import * as frequenciaController from '../controllers/frequenciaController';

    /**
     * Montado em /api/frequencia.
     * POST   /api/frequencia                                → registra presença em aula ou evento
     * GET    /api/frequencia/jovens/:id/frequencias-aula    → histórico de aulas do jovem
     * GET    /api/frequencia/jovens/:id/participacoes-evento→ histórico de eventos do jovem
     * GET    /api/frequencia/jovens/:id/taxa-presenca-aula  → taxa de presença em aulas
     * GET    /api/frequencia/jovens/:id/taxa-participacao-evento
     * DELETE /api/frequencia/frequencias-aula/:id           → remove registro de aula
     * DELETE /api/frequencia/participacoes-evento/:id       → remove registro de evento
     */
    const router = Router();

    router.post('/', asyncHandler(frequenciaController.registrar));

    router.get('/jovens/:id/frequencias-aula', asyncHandler(frequenciaController.buscarFrequenciasAulaPorJovem));
    router.get('/jovens/:id/participacoes-evento', asyncHandler(frequenciaController.buscarParticipacaoEventosPorJovem));
    router.get('/jovens/:id/taxa-presenca-aula', asyncHandler(frequenciaController.calcularTaxaPresencaAula));
    router.get('/jovens/:id/taxa-participacao-evento', asyncHandler(frequenciaController.calcularTaxaParticipacaoEvento));

    router.delete('/frequencias-aula/:id', asyncHandler(frequenciaController.removerFrequenciaAula));
    router.delete('/participacoes-evento/:id', asyncHandler(frequenciaController.removerParticipacaoEvento));

    export default router;