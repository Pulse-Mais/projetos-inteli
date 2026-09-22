if (window.lucide) {
  lucide.createIcons();
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const href = item.getAttribute("href");

    if (href && href !== "#") {
      return;
    }

    event.preventDefault();
    document.querySelectorAll(".nav-item").forEach((navItem) => {
      navItem.classList.remove("active");
    });
    item.classList.add("active");
  });
});

document.getElementById("impactBtn")?.addEventListener("click", () => {
  window.location.href = "impactoMentor.html";
});

document.getElementById("newSessionBtn")?.addEventListener("click", () => {
  window.location.href = "registrarMentoriaMentor.html";
});

document.getElementById("menteesBtn")?.addEventListener("click", () => {
  window.location.href = "mentoradosMentor.html";
});

document.querySelectorAll(".risk-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const jovem = button.dataset.jovem ?? "mentorado";
    window.location.href = `alertaRiscoMentor.html?jovem=${encodeURIComponent(jovem)}`;
  });
});

document.querySelectorAll(".profile-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const jovem = button.dataset.jovem ?? "mentorado";
    window.location.href = `perfilMentoradoMentor.html?jovem=${encodeURIComponent(jovem)}`;
  });
});

document.querySelectorAll(".mentoring-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const jovem = button.dataset.jovem ?? "";
    const query = jovem ? `?jovem=${encodeURIComponent(jovem)}` : "";
    window.location.href = `registrarMentoriaMentor.html${query}`;
  });
});

document.getElementById("viewAllMenteesBtn")?.addEventListener("click", () => {
  window.location.href = "mentoradosMentor.html";
});

document.querySelectorAll(".session-card").forEach((button) => {
  button.addEventListener("click", () => {
    const jovem = button.dataset.jovem ?? "mentorado";
    alert(`Abrindo detalhes da próxima sessão com: ${jovem}`);
  });
});


const riskStudentName = document.getElementById("riskStudentName");
const riskStudentAvatar = document.getElementById("riskStudentAvatar");

if (riskStudentName && riskStudentAvatar) {
  const params = new URLSearchParams(window.location.search);
  const jovem = params.get("jovem");

  if (jovem) {
    riskStudentName.textContent = jovem;
    riskStudentAvatar.textContent = jovem
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    const escalationUrl = document.getElementById("escalationUrl");
    const slug = jovem
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (escalationUrl) {
      escalationUrl.href = `https://pulsar.inteli.org/escalar/${slug}`;
      escalationUrl.textContent = escalationUrl.href;
    }

    document.querySelectorAll(".profile-btn, .mentoring-btn").forEach((button) => {
      button.dataset.jovem = jovem;
    });
  }
}

document.getElementById("copyEscalationBtn")?.addEventListener("click", async () => {
  const link = document.getElementById("escalationUrl")?.href;

  if (!link) {
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    alert("Link copiado.");
  } catch {
    window.prompt("Copie o link:", link);
  }
});

const selectedMentees = document.getElementById("selectedMentees");
const menteeSearch = document.getElementById("menteeSearch");

function createMenteeChip(name) {
  const chip = document.createElement("span");
  chip.className = "mentee-chip";
  chip.dataset.name = name;
  chip.append(document.createTextNode(name));

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-mentee";
  removeButton.setAttribute("aria-label", `Remover ${name}`);
  removeButton.textContent = "×";
  chip.append(removeButton);

  return chip;
}

function addMentee(name) {
  const cleanName = name.trim();

  if (!cleanName || !selectedMentees) {
    return;
  }

  const alreadySelected = Array.from(selectedMentees.children).some(
    (chip) => chip.dataset.name?.toLowerCase() === cleanName.toLowerCase()
  );

  if (!alreadySelected) {
    selectedMentees.append(createMenteeChip(cleanName));
  }
}

if (selectedMentees) {
  const params = new URLSearchParams(window.location.search);
  const jovem = params.get("jovem");

  if (jovem) {
    selectedMentees.replaceChildren();
    const chip = document.createElement("span");
    chip.className = "mentee-chip";
    chip.dataset.name = jovem;
    chip.textContent = jovem;
    selectedMentees.append(chip);
  }

  if (menteeSearch) {
    selectedMentees.addEventListener("click", (event) => {
      const removeButton = event.target.closest(".remove-mentee");
      removeButton?.closest(".mentee-chip")?.remove();
    });

    menteeSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        addMentee(menteeSearch.value.replace(/,$/, ""));
        menteeSearch.value = "";
      }
    });
  }
}

document.querySelectorAll(".topic-chip").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }
    button.classList.toggle("selected");
  });
});

document.getElementById("cancelMentoringBtn")?.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "dashboardMentor.html";
});

