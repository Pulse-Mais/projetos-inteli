import { Router } from 'express';
import { CoordenadoraController } from '../controllers/coordenadora.controller';
import { CoordenadoraRepository } from '../repositories/coordenadora.repository';
import { CoordenadoraService } from '../services/coordenadora.service';

const repository = new CoordenadoraRepository();
const service = new CoordenadoraService(repository);
const controller = new CoordenadoraController(service);

const router = Router();

router.get('/coordenadora/:rm', (req, res, next) => {
  console.log('[ROUTE] GET /coordenadora/:rm - Requisicao recebida', { rm: req.params.rm });
  controller.buscarPorRm(req, res).catch(next);
});


router.get('/coordenadora/:rm/alunos/filtros', (req, res, next) => {
  console.log('[ROUTE] GET /coordenadora/:rm/alunos/filtros - Requisicao recebida', {
    rm: req.params.rm,
    query: req.query,
  });
  controller.filtrarAlunos(req, res).catch(next);
});

router.get('/coordenadora/:rm/alunos', (req, res, next) => {
  console.log('[ROUTE] GET /coordenadora/:rm/alunos - Requisicao recebida', { rm: req.params.rm });
  controller.listarAlunos(req, res).catch(next);
});

router.post('/coordenadora/:rm/alunos', (req, res, next) => {
  console.log('[ROUTE] POST /coordenadora/:rm/alunos - Requisicao recebida', {
    rm: req.params.rm,
    body: req.body,
  });
  controller.cadastrarAluno(req, res).catch(next);
});

router.get('/coordenadora/:rm/eventos', (req, res, next) => {
  console.log('[ROUTE] GET /coordenadora/:rm/eventos - Requisicao recebida', { rm: req.params.rm });
  controller.listarComunicados(req, res).catch(next);
});

router.post('/coordenadora/:rm/eventos', (req, res, next) => {
  console.log('[ROUTE] POST /coordenadora/:rm/eventos - Requisicao recebida', {
    rm: req.params.rm,
    body: req.body,
  });
  controller.registrarEvento(req, res).catch(next);
});

router.delete('/coordenadora/:rm/eventos/:id_comunicado', (req, res, next) => {
  console.log('[ROUTE] DELETE /coordenadora/:rm/eventos/:id_comunicado - Requisicao recebida', {
    rm: req.params.rm,
    id_comunicado: req.params.id_comunicado,
  });
  controller.excluirComunicado(req, res).catch(next);
});

router.post('/coordenadora/:rm/alunos/:ra/modulos/:modulo/conclusao', (req, res, next) => {
  console.log('[ROUTE] POST /coordenadora/:rm/alunos/:ra/modulos/:modulo/conclusao - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
    modulo: req.params.modulo,
    body: req.body,
  });
  controller.concluirModuloAluno(req, res).catch(next);
});

router.delete('/coordenadora/:rm/alunos/:ra/modulos/:modulo/conclusao', (req, res, next) => {
  console.log('[ROUTE] DELETE /coordenadora/:rm/alunos/:ra/modulos/:modulo/conclusao - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
    modulo: req.params.modulo,
  });
  controller.desfazerConclusaoModuloAluno(req, res).catch(next);
});

router.post('/coordenadora/:rm/alunos/:ra/frequencias', (req, res, next) => {
  console.log('[ROUTE] POST /coordenadora/:rm/alunos/:ra/frequencias - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
    body: req.body,
  });
  controller.registrarFrequencia(req, res).catch(next);
});

router.post('/coordenadora/:rm/alunos/:ra/observacoes', (req, res, next) => {
  console.log('[ROUTE] POST /coordenadora/:rm/alunos/:ra/observacoes - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
    body: req.body,
  });
  controller.registrarObservacao(req, res).catch(next);
});

router.patch('/coordenadora/:rm/alunos/:ra/frequencias/:id_aula', (req, res, next) => {
  console.log('[ROUTE] PATCH /coordenadora/:rm/alunos/:ra/frequencias/:id_aula - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
    id_aula: req.params.id_aula,
    body: req.body,
  });
  controller.atualizarFrequencia(req, res).catch(next);
});

router.get('/coordenadora/:rm/alunos/:ra/relatorios', (req, res, next) => {
  console.log('[ROUTE] GET /coordenadora/:rm/alunos/:ra/relatorios - Requisicao recebida', {
    rm: req.params.rm,
    ra: req.params.ra,
  });
  controller.listarRelatorios(req, res).catch(next);
});

export default router;
