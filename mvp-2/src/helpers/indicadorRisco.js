// src/helpers/indicadorRisco.js

function calcularIndicadorFrequencia(percentualFrequencia) {
    if (percentualFrequencia < 50) {
        return { nivel: 'critico', label: 'Crítico < 50%', cor: 'vermelho' };
    }
    if (percentualFrequencia < 75) {
        return { nivel: 'atencao', label: 'Atenção < 75%', cor: 'amarelo' };
    }
    return { nivel: 'normal', label: null, cor: null };
}

function calcularRiscoEvasao(jovem) {
    const riscos = [];

    // null/undefined significa "ainda sem registro de frequência" (ex.: jovem recém-cadastrado)
    // — não há sinal suficiente para apontar risco, então o fator é ignorado.
    if (jovem.frequencia_ultimos_30_dias != null && jovem.frequencia_ultimos_30_dias < 75) {
        riscos.push('frequencia_baixa');
    }
    if (jovem.atividades_em_atraso >= 2) {
        riscos.push('atividades_atrasadas');
    }
    if (jovem.queda_frequencia_pp >= 7) {
        riscos.push('queda_acentuada');
    }
    if (jovem.dias_sem_interacao != null && jovem.dias_sem_interacao > 14) {
        riscos.push('sem_interacao');
    }

    return {
        em_risco: riscos.length > 0,
        fatores: riscos,
        nivel: riscos.length >= 2 ? 'alto' : riscos.length === 1 ? 'medio' : 'nenhum'
    };
}

module.exports = { calcularIndicadorFrequencia, calcularRiscoEvasao };