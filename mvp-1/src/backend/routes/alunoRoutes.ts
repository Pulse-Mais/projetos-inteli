import { Router } from 'express';
import { listar, buscar, criar, atualizar, tornarExAluno, excluirPermanente, buscarPerfil, buscarPortal, atualizarPortal, buscarConquistas, criarConquistaManual, deletarConquistaManual, loginPorEmail } from '../controllers/alunoController';
import {
  listar as listarHistorico,
  criar as criarHistorico,
  atualizar as atualizarHistorico,
  deletar as deletarHistorico,
} from '../controllers/historicoProfissionalController';
import {
  listar as listarEntregas,
  registrar,
  atualizar as atualizarEntrega,
  remover as removerEntrega,
} from '../controllers/entregaController';

const alunoRoutes = Router();

alunoRoutes.get('/', listar);
// /login ANTES de /:id para evitar conflito de matching
alunoRoutes.get('/login', loginPorEmail);
// RF004/RF005: rotas com sub-path ANTES de /:id para evitar conflito de matching
alunoRoutes.get('/:id/perfil', buscarPerfil);
alunoRoutes.get('/:id/portal', buscarPortal);
alunoRoutes.get('/:id/conquistas', buscarConquistas);
alunoRoutes.post('/:id/conquistas-manuais', criarConquistaManual);
alunoRoutes.delete('/:id/conquistas-manuais/:id_conquista', deletarConquistaManual);
alunoRoutes.patch('/:id/tornar-ex-aluno', tornarExAluno);
alunoRoutes.get('/:id', buscar);
alunoRoutes.post('/', criar);
alunoRoutes.put('/:id/portal', atualizarPortal);
alunoRoutes.put('/:id', atualizar);
alunoRoutes.delete('/:id', excluirPermanente);

// RF003 - sub-recurso entregas
alunoRoutes.get('/:id/entregas', listarEntregas);
alunoRoutes.post('/:id/entregas', registrar);
alunoRoutes.put('/:id/entregas/:id_atividade', atualizarEntrega);
alunoRoutes.delete('/:id/entregas/:id_atividade', removerEntrega);

// historico profissional
alunoRoutes.get('/:id/historico', listarHistorico);
alunoRoutes.post('/:id/historico', criarHistorico);
alunoRoutes.put('/:id/historico/:id_hist', atualizarHistorico);
alunoRoutes.delete('/:id/historico/:id_hist', deletarHistorico);

export { alunoRoutes };
