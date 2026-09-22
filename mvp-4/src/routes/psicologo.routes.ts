import {Router} from 'express'; 
import {PsicologoController} from '../controllers/psicologo.controller'; 
import {PsicologoService} from '../services/psicologo.service'; 
import {PsicologoRepository} from '../repositories/psicologo.repository'; 

const repositories = new PsicologoRepository (); 
const service = new PsicologoService(repositories); 
const controller = new PsicologoController(service); 

const router = Router(); 

function aplicarParametrosProntuarioDocumentado(req: any): void {
    req.params.rm = String(req.query.rm || req.body?.rm || 1);
    req.params.ra = req.params.id;
}

router.get('/psicologa/:rm/alunos', (req, res, next) => {
    console.log('[ROUTE] GET /psicologa/:rm/alunos - Requisição recebida', { rm: req.params.rm}); 
    controller.buscarAlunos(req, res).catch(next); 
});

router.post('/psicologo/alunos/:id/prontuario', (req, res, next) => {
    aplicarParametrosProntuarioDocumentado(req);
    const parametros = req.params as Record<string, string>;
    console.log('[ROUTE] POST /psicologo/alunos/:id/prontuario - Requisição recebida', {
        rm: parametros.rm,
        ra: parametros.ra,
        body: req.body,
    });
    controller.registrarProntuario(req, res).catch(next);
});

router.get('/psicologo/alunos/:id/prontuario', (req, res, next) => {
    aplicarParametrosProntuarioDocumentado(req);
    const parametros = req.params as Record<string, string>;
    console.log('[ROUTE] GET /psicologo/alunos/:id/prontuario - Requisição recebida', {
        rm: parametros.rm,
        ra: parametros.ra,
    });
    controller.buscarProntuarios(req, res).catch(next);
});

router.post('/psicologa/:rm/alunos/:ra/relatorios', (req, res, next) => {
    console.log('[ROUTE] POST /psicologa/:rm/alunos/:ra/relatorios - Requisição recebida', {
        rm: req.params.rm,
        ra: req.params.ra,
        body: req.body,
    }); 
    controller.registrarProntuario(req, res).catch(next); 
});

router.get('/psicologa/:rm/alunos/:ra/relatorios', (req, res, next) => {
    console.log('[ROUTE] GET /psicologa/:rm/alunos/:ra/relatorios - Requisição recebida', {
        rm: req.params.rm,
        ra: req.params.ra,
    }); 
    controller.buscarProntuarios(req, res).catch(next); 
});

router.patch('/psicologa/:rm/alunos/:ra/relatorios/:id_relatorio', (req, res, next) => {
    console.log('[ROUTE] PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio - Requisição recebida', {
        rm: req.params.rm,
        ra: req.params.ra,
        id_relatorio: req.params.id_relatorio,
        body: req.body,
    }); 
    controller.atualizarProntuario(req, res).catch(next); 
});

router.patch('/psicologa/:rm/alunos/:ra/status', (req, res, next) => {
    console.log('[ROUTE] PATCH /psicologa/:rm/alunos/:ra/status - RequisiÃ§Ã£o recebida', {
        rm: req.params.rm,
        ra: req.params.ra,
        body: req.body,
    });
    controller.atualizarStatusAtendimento(req, res).catch(next);
});

router.get('/psicologa/:rm', (req, res, next) => {
    console.log('[ROUTE] GET /psicologa/:rm - Requisição recebida', { rm: req.params.rm}); 
    controller.buscarRmPsi(req, res).catch(next); 
});

router.get('/psicologo/:rm', (req, res, next) => {
    console.log('[ROUTE] GET /psicologo/:rm - Requisição recebida', { rm: req.params.rm}); 
    controller.buscarRmPsi(req, res).catch(next); 
});

export default router; 
