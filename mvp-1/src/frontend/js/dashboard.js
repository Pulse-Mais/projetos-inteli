document.addEventListener("DOMContentLoaded", function () {
  const fotoCoord = localStorage.getItem("fotoCoord");
  if (fotoCoord) {
    const av = document.querySelector(".sidebar__avatar");
    if (av) av.src = fotoCoord;
  }

  let todosAlunos = [];
  let frequenciasCache = {};
  let categoriaSelecionada = "todas";
  let anoSelecionado = "todos";
  let pizzaChart = null;

  // Dispara as três cargas de dados em paralelo ao inicializar a página
  async function inicializar() {
    await Promise.all([
      carregarAlunos(),
      carregarBarrasEstatico(),
      carregarMentores(),
    ]);
  }

  // Busca a contagem de mentores ativos via GET /mentores e exibe no card de KPI
  async function carregarMentores() {
    try {
      const res = await fetch("/mentores");
      if (!res.ok) throw new Error("Erro " + res.status);
      const mentores = await res.json();
      const el = document.getElementById("valMentores");
      if (el) el.textContent = mentores.length;
    } catch (err) {
      console.error("Erro ao carregar mentores:", err);
      const el = document.getElementById("valMentores");
      if (el) el.textContent = "—";
    }
  }

  // Busca todos os alunos via GET /alunos, pré-carrega as frequências e aplica os filtros
  async function carregarAlunos() {
    try {
      const [resAtivos, resExAlunos] = await Promise.all([
        fetch("/alunos"),
        fetch("/alunos?ativo=false"),
      ]);

      const ativos = resAtivos.ok ? await resAtivos.json() : [];
      const exAlunos = resExAlunos.ok ? await resExAlunos.json() : [];

      todosAlunos = ativos; // tabela e filtros só mostram ativos
      todosAlunos._exAlunos = exAlunos; // guarda ex-alunos para a contagem

      popularFiltroAno();

      // Carrega frequências de todos os alunos em paralelo para evitar N requisições sequenciais
      const freqs = await Promise.all(
        todosAlunos.map(function (a) {
          return fetch("/frequencia?id_aluno=" + a.id_usuario)
            .then(function (r) {
              return r.ok ? r.json() : [];
            })
            .catch(function () {
              return [];
            });
        }),
      );
      todosAlunos.forEach(function (a, i) {
        frequenciasCache[a.id_usuario] = freqs[i];
      });

      aplicarFiltros();
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
    }
  }

  // Busca os dados estáticos de alunos por programa via GET /dashboard e renderiza o gráfico de barras
  async function carregarBarrasEstatico() {
    try {
      const res = await fetch("/dashboard");
      if (!res.ok) throw new Error("Erro " + res.status);
      const data = await res.json();
      renderizarBarras(data.alunos_por_programa ?? []);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    }
  }

  // Preenche o select de ano com os anos únicos de ingresso dos alunos carregados
  function popularFiltroAno() {
    const anos = [
      ...new Set(
        todosAlunos
          .map(function (a) {
            return a.data_ingresso
              ? new Date(a.data_ingresso).getFullYear()
              : null;
          })
          .filter(Boolean),
      ),
    ].sort(function (a, b) {
      return b - a;
    });

    const select = document.getElementById("filtroAno");
    if (!select) return;
    anos.forEach(function (ano) {
      const opt = document.createElement("option");
      opt.value = String(ano);
      opt.textContent = String(ano);
      select.appendChild(opt);
    });
  }

  // Filtra os alunos pelo programa e ano selecionados e atualiza os indicadores e a tabela
  function aplicarFiltros() {
    const filtrados = todosAlunos.filter(function (a) {
      const prog = (a.programa_ingresso || "").toLowerCase();
      const matchCat =
        categoriaSelecionada === "todas" || prog.includes(categoriaSelecionada);

      const ano = a.data_ingresso
        ? new Date(a.data_ingresso).getFullYear()
        : null;
      const matchAno =
        anoSelecionado === "todos" || String(ano) === anoSelecionado;

      return matchCat && matchAno;
    });

    renderizarIndicadores(filtrados);
    renderizarTabelaEvasao(filtrados);
  }

  // Conta os alunos por programa e atualiza os cards de KPI e o gráfico de pizza
  function renderizarIndicadores(alunos) {
    const exAlunos = todosAlunos._exAlunos || [];

    const conectados = alunos.filter(function (a) {
      return a.estagio_jornada === "conectado";
    }).length;

    const capacitados = alunos.filter(function (a) {
      return a.estagio_jornada === "capacitado";
    }).length;

    const transformados = exAlunos.filter(function (a) {
      return a.estagio_jornada === "transformado";
    }).length;

    var elC = document.getElementById("valConectados");
    var elCap = document.getElementById("valCapacitados");
    var elT = document.getElementById("valTransformados");
    if (elC) elC.textContent = conectados;
    if (elCap) elCap.textContent = capacitados;
    if (elT) elT.textContent = transformados;

    renderizarPizza(conectados, capacitados, transformados);
  }

  // Renderiza o gráfico de pizza com a distribuição por programa; destrói instância anterior se existir
  function renderizarPizza(conectados, capacitados, transformados) {
    const canvas = document.getElementById("graficoPizza");
    const semDados = document.getElementById("graficoPizzaSemDados");
    if (!canvas) return;

    if (pizzaChart) {
      pizzaChart.destroy();
      pizzaChart = null;
    }

    if (conectados + capacitados + transformados === 0) {
      canvas.style.display = "none";
      if (semDados) semDados.style.display = "block";
      return;
    }

    canvas.style.display = "block";
    if (semDados) semDados.style.display = "none";

    pizzaChart = new Chart(canvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Conectados", "Capacitados", "Transformados"],
        datasets: [
          {
            data: [conectados, capacitados, transformados],
            backgroundColor: ["#003870", "#25B057", "#F59E0B"],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { family: "Poppins", size: 12, weight: "500" },
              padding: 20,
            },
          },
        },
      },
    });
  }

  // Renderiza o gráfico de barras com a contagem de alunos matriculados por programa
  function renderizarBarras(porPrograma) {
    const wrapper = document.getElementById("graficoBarrasWrapper");
    const ctx = document.getElementById("graficoBarras");
    if (!ctx || !wrapper) return;

    if (!porPrograma || porPrograma.length === 0) {
      wrapper.innerHTML =
        '<p style="color:var(--color-text-support);font-size:14px;text-align:center;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;">Nenhum aluno matriculado em programas ainda.</p>';
      return;
    }

    new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: porPrograma.map(function (p) {
          return p.nome_programa.replace(/^Programa\s+/i, "");
        }),
        datasets: [
          {
            label: "Alunos",
            data: porPrograma.map(function (p) {
              return p.total_alunos;
            }),
            backgroundColor: "#25B057",
            borderRadius: 4,
            barThickness: 28,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: {
              font: { family: "Poppins", size: 12 },
              precision: 0,
            },
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: "Poppins", size: 12 } },
          },
        },
      },
    });
  }

  // Renderiza a tabela de evasão ordenando os alunos pelo menor percentual de frequência
  function renderizarTabelaEvasao(alunos) {
    const tbody = document.getElementById("tabelaEvasao");
    if (!tbody) return;

    if (!alunos || alunos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--color-text-support);padding:20px;">Nenhum aluno encontrado para os filtros selecionados.</td></tr>';
      return;
    }

    var linhas = alunos.map(function (a) {
      var nome = a.usuario ? a.usuario.nome : "—";
      var prog = a.programa_ingresso || "—";
      var ini = nome
        .split(" ")
        .map(function (p) {
          return p[0];
        })
        .slice(0, 2)
        .join("")
        .toUpperCase();
      var registros = Array.isArray(frequenciasCache[a.id_usuario])
        ? frequenciasCache[a.id_usuario]
        : [];
      var total = registros.length;
      var presentes = registros.filter(function (r) {
        return r.status === "presente";
      }).length;
      var pct = total > 0 ? Math.round((presentes / total) * 100) : null;
      return { nome: nome, prog: prog, ini: ini, pct: pct };
    });

    linhas.sort(function (a, b) {
      if (a.pct === null && b.pct === null) return 0;
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });

    tbody.innerHTML = linhas
      .map(function (l) {
        var freqTexto, freqCor, priorizacao;

        if (l.pct === null) {
          freqTexto = "Sem registro";
          freqCor = "var(--color-text-support)";
          priorizacao =
            '<span class="badge badge--pendente">Em acompanhamento</span>';
        } else if (l.pct < 50) {
          freqTexto = l.pct + "%";
          freqCor = "var(--color-danger)";
          priorizacao =
            '<span class="badge badge--inativo">Risco de evasão</span>';
        } else if (l.pct < 75) {
          freqTexto = l.pct + "%";
          freqCor = "var(--color-warning)";
          priorizacao = '<span class="badge badge--pendente">Atenção</span>';
        } else {
          freqTexto = l.pct + "%";
          freqCor = "var(--color-accent)";
          priorizacao = '<span class="badge badge--ativo">Regular</span>';
        }

        return (
          "<tr>" +
          '<td data-label="Aluno(a)"><div class="aluno-info-cell"><div class="aluno-avatar-mini">' +
          l.ini +
          "</div><span>" +
          l.nome +
          "</span></div></td>" +
          '<td data-label="Programa">' +
          l.prog +
          "</td>" +
          '<td data-label="Frequência"><span class="freq-valor" style="color:' +
          freqCor +
          ';font-weight:600">' +
          freqTexto +
          "</span></td>" +
          '<td data-label="Priorização">' +
          priorizacao +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  // =============================================
  // EVENT LISTENERS
  // =============================================
  document.querySelectorAll(".dash-filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".dash-filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      this.classList.add("active");
      categoriaSelecionada = this.dataset.category;
      aplicarFiltros();
    });
  });

  // Filtro de ano: atualiza o ano selecionado e re-aplica os filtros
  var selectAno = document.getElementById('filtroAno');
  if (selectAno) {
    selectAno.addEventListener("change", function () {
      anoSelecionado = this.value;
      aplicarFiltros();
    });
  }

  inicializar();
});

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm("Deseja realmente sair?")) {
    const foto = localStorage.getItem("fotoCoord");
    localStorage.clear();
    if (foto) localStorage.setItem("fotoCoord", foto);
    window.location.href = "../index.html";
  }
}
