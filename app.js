const probabilityByLikelihood = {
  1: 0.03,
  2: 0.08,
  3: 0.18,
  4: 0.38,
  5: 0.65,
};

const demoRisks = [
  {
    id: "risk-1",
    name: "Cloud region outage",
    category: "Technology",
    likelihood: 3,
    impact: 5,
    exposure: 320000,
    owner: "Platform",
  },
  {
    id: "risk-2",
    name: "Regulatory filing delay",
    category: "Compliance",
    likelihood: 2,
    impact: 4,
    exposure: 140000,
    owner: "Legal",
  },
  {
    id: "risk-3",
    name: "Critical supplier disruption",
    category: "Supply Chain",
    likelihood: 4,
    impact: 4,
    exposure: 260000,
    owner: "Operations",
  },
  {
    id: "risk-4",
    name: "Credential stuffing attack",
    category: "Security",
    likelihood: 4,
    impact: 5,
    exposure: 420000,
    owner: "Security",
  },
  {
    id: "risk-5",
    name: "Forecast miss in key market",
    category: "Finance",
    likelihood: 3,
    impact: 3,
    exposure: 110000,
    owner: "Finance",
  },
  {
    id: "risk-6",
    name: "Public service incident",
    category: "Reputation",
    likelihood: 2,
    impact: 5,
    exposure: 180000,
    owner: "Communications",
  },
];

const state = {
  risks: demoRisks.map((risk) => ({ ...risk })),
  selectedRiskId: demoRisks[0]?.id || null,
  mitigation: {
    likelihoodCut: 0,
    impactCut: 0,
  },
};

const elements = {
  matrixGrid: document.getElementById("matrix-grid"),
  matrixPoints: document.getElementById("matrix-points"),
  matrixTip: document.getElementById("matrix-tip"),
  rankingList: document.getElementById("ranking-list"),
  riskForm: document.getElementById("risk-form"),
  loadDemo: document.getElementById("load-demo"),
  clearRisks: document.getElementById("clear-risks"),
  totalRisks: document.getElementById("total-risks"),
  criticalRisks: document.getElementById("critical-risks"),
  expectedLoss: document.getElementById("expected-loss"),
  medianScore: document.getElementById("median-score"),
  selectedRisk: document.getElementById("selected-risk"),
  likeCut: document.getElementById("like-cut"),
  impactCut: document.getElementById("impact-cut"),
  likeCutValue: document.getElementById("like-cut-value"),
  impactCutValue: document.getElementById("impact-cut-value"),
  mitigationSummary: document.getElementById("mitigation-summary"),
  beforeScore: document.getElementById("before-score"),
  afterScore: document.getElementById("after-score"),
  beforeScoreLabel: document.getElementById("before-score-label"),
  afterScoreLabel: document.getElementById("after-score-label"),
  formLikelihood: document.getElementById("form-likelihood"),
  formLikelihoodValue: document.getElementById("form-likelihood-value"),
  formImpact: document.getElementById("form-impact"),
  formImpactValue: document.getElementById("form-impact-value"),
};

function uid() {
  return `risk-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getScoreBand(score) {
  if (score >= 16) {
    return "critical";
  }
  if (score >= 10) {
    return "high";
  }
  if (score >= 5) {
    return "medium";
  }
  return "low";
}

function withMetrics(risk) {
  const score = risk.likelihood * risk.impact;
  const expectedLoss = risk.exposure * probabilityByLikelihood[risk.likelihood];

  return {
    ...risk,
    score,
    expectedLoss,
    band: getScoreBand(score),
  };
}

function getRiskMetrics() {
  return state.risks.map(withMetrics);
}

function buildMatrixGrid() {
  if (elements.matrixGrid.children.length > 0) {
    return;
  }

  for (let impact = 5; impact >= 1; impact -= 1) {
    for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
      const severity = likelihood + impact;
      let tone = 1;

      if (severity >= 10) {
        tone = 5;
      } else if (severity >= 8) {
        tone = 4;
      } else if (severity >= 7) {
        tone = 3;
      } else if (severity >= 5) {
        tone = 2;
      }

      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.dataset.tone = String(tone);
      elements.matrixGrid.appendChild(cell);
    }
  }
}

function renderSummary(risks) {
  const total = risks.length;
  const critical = risks.filter((risk) => risk.score >= 16).length;
  const expectedLoss = risks.reduce((sum, risk) => sum + risk.expectedLoss, 0);

  let median = 0;
  if (total > 0) {
    const sortedScores = risks.map((risk) => risk.score).sort((a, b) => a - b);
    const middle = Math.floor(sortedScores.length / 2);
    median =
      sortedScores.length % 2 === 0
        ? (sortedScores[middle - 1] + sortedScores[middle]) / 2
        : sortedScores[middle];
  }

  elements.totalRisks.textContent = String(total);
  elements.criticalRisks.textContent = String(critical);
  elements.expectedLoss.textContent = toCurrency(expectedLoss);
  elements.medianScore.textContent = String(Number(median.toFixed(1)));
}

function renderMatrix(risks) {
  elements.matrixPoints.innerHTML = "";

  if (risks.length === 0) {
    elements.matrixTip.textContent = "No risks yet. Add one or load demo data.";
    return;
  }

  const occupancy = {};

  risks.forEach((risk) => {
    const key = `${risk.likelihood}-${risk.impact}`;
    const count = occupancy[key] || 0;
    occupancy[key] = count + 1;

    const xPercent = ((risk.likelihood - 0.5) / 5) * 100;
    const yPercent = ((5.5 - risk.impact) / 5) * 100;
    const xOffset = ((count % 3) - 1) * 9;
    const yOffset = Math.floor(count / 3) * -9;

    const point = document.createElement("button");
    point.type = "button";
    point.className = `matrix-point band-${risk.band}`;

    if (risk.id === state.selectedRiskId) {
      point.classList.add("selected");
    }

    point.style.left = `calc(${xPercent}% + ${xOffset}px)`;
    point.style.top = `calc(${yPercent}% + ${yOffset}px)`;
    point.title = `${risk.name} | Score ${risk.score} | ${toCurrency(risk.expectedLoss)} expected loss`;

    point.addEventListener("click", () => {
      state.selectedRiskId = risk.id;
      state.mitigation.likelihoodCut = 0;
      state.mitigation.impactCut = 0;
      render();
    });

    elements.matrixPoints.appendChild(point);
  });

  const selected = risks.find((risk) => risk.id === state.selectedRiskId);
  if (selected) {
    elements.matrixTip.textContent = `Selected: ${selected.name} (score ${selected.score}, ${toCurrency(
      selected.expectedLoss
    )} expected loss)`;
  } else {
    elements.matrixTip.textContent = "Click a risk point to inspect mitigation.";
  }
}

function renderRanking(risks) {
  elements.rankingList.innerHTML = "";

  if (risks.length === 0) {
    elements.rankingList.innerHTML = '<p class="matrix-tip">No risk entries to rank.</p>';
    return;
  }

  const sorted = [...risks].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.expectedLoss - a.expectedLoss;
  });

  const maxScore = Math.max(...sorted.map((risk) => risk.score), 1);

  sorted.forEach((risk) => {
    const row = document.createElement("article");
    row.className = "risk-row";
    if (risk.id === state.selectedRiskId) {
      row.classList.add("selected");
    }

    row.innerHTML = `
      <div class="risk-row-head">
        <span class="risk-name">${escapeHtml(risk.name)}</span>
        <span class="risk-meta">${escapeHtml(risk.category)} | ${escapeHtml(risk.owner || "Unassigned")}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width: ${(risk.score / maxScore) * 100}%"></div></div>
      <div class="risk-row-foot">
        <span>Score ${risk.score} (${risk.band})</span>
        <span>${toCurrency(risk.expectedLoss)} loss</span>
      </div>
    `;

    row.addEventListener("click", () => {
      state.selectedRiskId = risk.id;
      state.mitigation.likelihoodCut = 0;
      state.mitigation.impactCut = 0;
      render();
    });

    elements.rankingList.appendChild(row);
  });
}

function renderMitigationPlanner(risks) {
  elements.selectedRisk.innerHTML = "";

  if (risks.length === 0) {
    elements.selectedRisk.disabled = true;
    elements.likeCut.disabled = true;
    elements.impactCut.disabled = true;
    elements.likeCut.max = "0";
    elements.impactCut.max = "0";
    elements.likeCut.value = "0";
    elements.impactCut.value = "0";
    elements.likeCutValue.textContent = "0";
    elements.impactCutValue.textContent = "0";
    elements.beforeScore.style.width = "0%";
    elements.afterScore.style.width = "0%";
    elements.beforeScoreLabel.textContent = "0";
    elements.afterScoreLabel.textContent = "0";
    elements.mitigationSummary.textContent = "Select or add a risk to test mitigations.";
    return;
  }

  elements.selectedRisk.disabled = false;
  elements.likeCut.disabled = false;
  elements.impactCut.disabled = false;

  risks.forEach((risk) => {
    const option = document.createElement("option");
    option.value = risk.id;
    option.textContent = `${risk.name} (${risk.score})`;
    elements.selectedRisk.appendChild(option);
  });

  let selected = risks.find((risk) => risk.id === state.selectedRiskId);
  if (!selected) {
    selected = risks[0];
    state.selectedRiskId = selected.id;
  }

  elements.selectedRisk.value = selected.id;

  const maxLikelihoodCut = Math.max(selected.likelihood - 1, 0);
  const maxImpactCut = Math.max(selected.impact - 1, 0);

  state.mitigation.likelihoodCut = clamp(state.mitigation.likelihoodCut, 0, maxLikelihoodCut);
  state.mitigation.impactCut = clamp(state.mitigation.impactCut, 0, maxImpactCut);

  elements.likeCut.max = String(maxLikelihoodCut);
  elements.impactCut.max = String(maxImpactCut);
  elements.likeCut.value = String(state.mitigation.likelihoodCut);
  elements.impactCut.value = String(state.mitigation.impactCut);
  elements.likeCutValue.textContent = String(state.mitigation.likelihoodCut);
  elements.impactCutValue.textContent = String(state.mitigation.impactCut);

  const residualLikelihood = selected.likelihood - state.mitigation.likelihoodCut;
  const residualImpact = selected.impact - state.mitigation.impactCut;
  const residualScore = residualLikelihood * residualImpact;
  const residualLoss = selected.exposure * probabilityByLikelihood[residualLikelihood];

  const scoreReduction = selected.score - residualScore;
  const lossReduction = selected.expectedLoss - residualLoss;

  elements.beforeScore.style.width = `${(selected.score / 25) * 100}%`;
  elements.afterScore.style.width = `${(residualScore / 25) * 100}%`;
  elements.beforeScoreLabel.textContent = String(selected.score);
  elements.afterScoreLabel.textContent = String(residualScore);

  elements.mitigationSummary.innerHTML = `
    <strong>${escapeHtml(selected.name)}</strong><br>
    Baseline: score ${selected.score}, ${toCurrency(selected.expectedLoss)} expected loss.<br>
    Residual: score ${residualScore}, ${toCurrency(residualLoss)} expected loss.<br>
    Reduction: ${scoreReduction} score points and ${toCurrency(lossReduction)} in expected loss.
  `;
}

function render() {
  const risks = getRiskMetrics();
  renderSummary(risks);
  renderMatrix(risks);
  renderRanking(risks);
  renderMitigationPlanner(risks);
}

function resetFormRangeOutputs() {
  elements.formLikelihoodValue.textContent = elements.formLikelihood.value;
  elements.formImpactValue.textContent = elements.formImpact.value;
}

elements.riskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(elements.riskForm);

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return;
  }

  const risk = {
    id: uid(),
    name,
    category: String(formData.get("category") || "Operations"),
    likelihood: clamp(Number(formData.get("likelihood") || 3), 1, 5),
    impact: clamp(Number(formData.get("impact") || 3), 1, 5),
    exposure: Math.max(Number(formData.get("exposure") || 0), 0),
    owner: String(formData.get("owner") || "").trim(),
  };

  state.risks.push(risk);
  state.selectedRiskId = risk.id;
  state.mitigation.likelihoodCut = 0;
  state.mitigation.impactCut = 0;

  elements.riskForm.reset();
  elements.formLikelihood.value = "3";
  elements.formImpact.value = "3";
  resetFormRangeOutputs();

  render();
});

elements.loadDemo.addEventListener("click", () => {
  state.risks = demoRisks.map((risk) => ({ ...risk }));
  state.selectedRiskId = state.risks[0]?.id || null;
  state.mitigation.likelihoodCut = 0;
  state.mitigation.impactCut = 0;
  render();
});

elements.clearRisks.addEventListener("click", () => {
  state.risks = [];
  state.selectedRiskId = null;
  state.mitigation.likelihoodCut = 0;
  state.mitigation.impactCut = 0;
  render();
});

elements.selectedRisk.addEventListener("change", (event) => {
  state.selectedRiskId = event.target.value;
  state.mitigation.likelihoodCut = 0;
  state.mitigation.impactCut = 0;
  render();
});

elements.likeCut.addEventListener("input", (event) => {
  state.mitigation.likelihoodCut = Number(event.target.value || 0);
  render();
});

elements.impactCut.addEventListener("input", (event) => {
  state.mitigation.impactCut = Number(event.target.value || 0);
  render();
});

elements.formLikelihood.addEventListener("input", resetFormRangeOutputs);

elements.formImpact.addEventListener("input", resetFormRangeOutputs);

buildMatrixGrid();
resetFormRangeOutputs();
render();
