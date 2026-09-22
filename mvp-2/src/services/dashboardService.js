// src/services/dashboardService.js

const dashboardRepository = require('../repositories/dashboardRepository');
const { calcularRiscoEvasao } = require('../helpers/indicadorRisco');
const { notificarGestores } = require('../helpers/notificacaoHelper');

class DashboardService {
    async obterKPIs(programaId = null) {
        const [
            jovens_ativos,
            jovens_empregados,
            jovens_com_bolsa,
            evasaoRaw,
            jovens_conectados,
            computadores_doados,
            mentorias_realizadas,
            media_frequencia,
            jovens_com_alerta,
            distribuicao_por_programa,
            jornada_jovens,
        ] = await Promise.all([
            dashboardRepository.contarJovensAtivos(programaId),
            dashboardRepository.contarJovensEmpregados(programaId),
            dashboardRepository.contarJovensComBolsa(programaId),
            dashboardRepository.calcularIndiceEvasao(programaId),
            dashboardRepository.contarJovensConectados(programaId),
            dashboardRepository.contarComputadoresDoados(),
            dashboardRepository.contarMentoriasRealizadas(programaId),
            dashboardRepository.calcularMediaFrequencia(programaId),
            dashboardRepository.contarJovensComAlertaAtivo(programaId),
            // Com um programa selecionado, "distribuição por programa" não tem sentido
            // (seria sempre 100%) — mostramos a distribuição por turma daquele programa.
            programaId
                ? dashboardRepository.buscarDistribuicaoPorTurma(programaId)
                : dashboardRepository.buscarDistribuicaoPorPrograma(),
            dashboardRepository.buscarJornadaJovens(programaId),
        ]);


        const taxa = evasaoRaw.total > 0
        ? parseFloat(((evasaoRaw.evadidos / evasaoRaw.total) * 100).toFixed(2))
        : 0;

        return {
            jovens_ativos,
            jovens_empregados,
            jovens_com_bolsa,
            evasao: {
                evadidos: evasaoRaw.evadidos,
                total: evasaoRaw.total,
                taxa,
            },
            jovens_conectados,
            computadores_doados,
            mentorias_realizadas,
            media_frequencia,
            jovens_com_alerta,
            distribuicao_por_programa,
            distribuicao_tipo: programaId ? 'turma' : 'programa',
            jornada_jovens,
        };

    }

    async obterJovensEmRisco(programaId = null) {
        const jovens = await dashboardRepository.buscarJovensEmRisco(programaId);

    const emRisco = jovens
        .filter(j => j.dias_sem_interacao !== null) // só quem tem ao menos uma aula registrada
        .map(j => ({
            id: j.id,
            nome: j.nome,
            programa: j.programa || null,
            frequencia_ultimos_30_dias: parseFloat((j.frequencia_ultimos_30_dias || 0).toFixed(1)),
            dias_sem_interacao: j.dias_sem_interacao,
            atividades_em_atraso: j.atividades_em_atraso,
            risco: calcularRiscoEvasao({
                frequencia_ultimos_30_dias: j.frequencia_ultimos_30_dias,
                dias_sem_interacao: j.dias_sem_interacao,
                atividades_em_atraso: j.atividades_em_atraso,
                queda_frequencia_pp: 0
            })
        }))
        .filter(j => j.risco.em_risco);

    for (const j of emRisco) {
        notificarGestores('Alerta', `Risco de evasão: ${j.nome}`, {
            descricao: `Frequência: ${j.frequencia_ultimos_30_dias}% · ${j.dias_sem_interacao} dias sem interação`,
            link: `/jovens/${j.id}`,
        }).catch(() => {});
    }

    return emRisco;

    }

        async obterDashboardMentor(mentor_id) {
        return dashboardRepository.buscarDadosMentor(mentor_id);
    }

        async obterDashboardAluno(jovem_id) {
        return dashboardRepository.buscarDadosAluno(jovem_id);
    }
}


module.exports = new DashboardService();