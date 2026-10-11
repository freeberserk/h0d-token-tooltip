const MODULE_ID = "h0d-token-tooltip";

let hoveredToken = null;
let tooltipEl = null;
let lastPointer = { x: 0, y: 0 };

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Activer l’infobulle",
    hint: "Affiche les statistiques H0D au survol des tokens.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "gmOnly", {
    name: "MJ uniquement",
    hint: "Si activé, seuls les comptes Gamemaster voient l’infobulle.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "showStates", {
    name: "Afficher les états des machines",
    hint: "Affiche les états principaux des machines lorsqu'ils sont actifs.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.once("ready", () => {
  createTooltip();

  document.addEventListener("pointermove", event => {
    lastPointer = { x: event.clientX, y: event.clientY };
    if (hoveredToken && tooltipEl?.classList.contains("h0d-visible")) positionTooltip();
  }, { passive: true });

  Hooks.on("hoverToken", (token, hovered) => {
    if (!canDisplay()) return;
    if (hovered) {
      hoveredToken = token;
      renderTooltip(token);
    } else if (hoveredToken === token) {
      hoveredToken = null;
      hideTooltip();
    }
  });

  Hooks.on("updateActor", actor => {
    if (hoveredToken?.actor?.id === actor.id) renderTooltip(hoveredToken);
  });

  Hooks.on("updateToken", tokenDocument => {
    if (hoveredToken?.document?.id === tokenDocument.id) renderTooltip(hoveredToken);
  });

  console.log("H0D Token Tooltip | prêt");
});

function canDisplay() {
  if (!game.settings.get(MODULE_ID, "enabled")) return false;
  if (game.settings.get(MODULE_ID, "gmOnly") && !game.user?.isGM) return false;
  return true;
}

function createTooltip() {
  if (tooltipEl) return;
  tooltipEl = document.createElement("div");
  tooltipEl.id = "h0d-token-tooltip";
  tooltipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltipEl);
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove("h0d-visible");
  tooltipEl.setAttribute("aria-hidden", "true");
}

function positionTooltip() {
  if (!tooltipEl) return;
  const margin = 14;
  const offset = 18;
  const rect = tooltipEl.getBoundingClientRect();
  let left = lastPointer.x + offset;
  let top = lastPointer.y + offset;

  if (left + rect.width + margin > window.innerWidth) left = lastPointer.x - rect.width - offset;
  if (top + rect.height + margin > window.innerHeight) top = lastPointer.y - rect.height - offset;

  tooltipEl.style.left = `${Math.max(margin, left)}px`;
  tooltipEl.style.top = `${Math.max(margin, top)}px`;
}

function renderTooltip(token) {
  if (!tooltipEl || !token?.actor || !canDisplay()) {
    hideTooltip();
    return;
  }

  const data = getH0DStats(token.actor);
  if (!data) {
    hideTooltip();
    return;
  }

  const rows = [];
  if (data.hpCurrent !== null || data.hpMax !== null) {
    rows.push(statRow("fa-solid fa-heart", "PV", `${formatValue(data.hpCurrent)} / ${formatValue(data.hpMax)}`));
  }
  if (data.defense !== null) rows.push(statRow("fa-solid fa-shield-halved", "DEF", formatValue(data.defense)));
  if (data.speed !== null) rows.push(statRow("fa-solid fa-person-running", "Vitesse", `${formatValue(data.speed)} m`));
  if (data.perception !== null) rows.push(statRow("fa-solid fa-eye", "Perception", signedValue(data.perception)));

  if (!rows.length) {
    hideTooltip();
    return;
  }

  const statesHtml = data.states?.length
    ? `<div class="h0d-tooltip-states">${data.states.map(s => `<span>${escapeHtml(s)}</span>`).join("")}</div>`
    : "";

  tooltipEl.innerHTML = `
    <div class="h0d-tooltip-header">
      <div class="h0d-tooltip-name">${escapeHtml(token.name || token.actor.name || "Token")}</div>
      <div class="h0d-tooltip-type">${escapeHtml(data.typeLabel)}</div>
    </div>
    <div class="h0d-tooltip-body">${rows.join("")}</div>
    ${statesHtml}
  `;

  tooltipEl.classList.add("h0d-visible");
  tooltipEl.setAttribute("aria-hidden", "false");
  positionTooltip();
}

function statRow(icon, label, value) {
  return `<div class="h0d-tooltip-row">
    <i class="${icon}" aria-hidden="true"></i>
    <span class="h0d-tooltip-label">${escapeHtml(label)}</span>
    <strong>${escapeHtml(String(value))}</strong>
  </div>`;
}

function getH0DStats(actor) {
  const p = actor.system?.props ?? {};

  if (hasAny(p, ["H0D_Machine_PV_Actuels", "H0D_Machine_PV_Corps_Base"])) return machineStats(p);
  if (hasAny(p, ["H0D_Creature_PV_Actuels", "H0D_Creature_PV_Base"])) return creatureStats(p);
  if (hasAny(p, ["H0D_PV_Actuels", "H0D_FOR", "H0D_Defense_Totale_Calc"])) return pjStats(p);

  return null;
}

function pjStats(p) {
  return {
    typeLabel: "PJ",
    hpCurrent: firstNumber(p, ["H0D_PV_Actuels"]),
    hpMax: firstNumber(p, ["H0D_PV_Max_Calc", "H0D_PV_Max_Total", "H0D_PV_Base_Total_Calc"]),
    defense: firstNumber(p, ["H0D_Defense_Totale_Calc", "H0D_Defense_Totale"]),
    speed: firstNumber(p, ["H0D_Vitesse_Effective", "H0D_Vitesse"]),
    perception: firstNumber(p, ["H0D_Skill_Perception_Total"]),
    states: []
  };
}

function creatureStats(p) {
  let speed = firstNumber(p, ["H0D_Creature_Vitesse_Total_Calc", "H0D_Creature_Vitesse_Total_Aff"]);
  if (speed === null) {
    const base = numberOrNull(p.H0D_Creature_Vitesse_Base);
    if (base !== null) speed = Math.max(0, base + numberOrZero(p.H0D_Creature_Vitesse_Divers) + numberOrZero(p.H0D_Creature_Mod_Vitesse_Total));
  }

  return {
    typeLabel: "Créature / PNJ",
    hpCurrent: firstNumber(p, ["H0D_Creature_PV_Actuels"]),
    hpMax: firstNumber(p, ["H0D_Creature_PV_Max_Calc", "H0D_Creature_PV_Max_Aff"]),
    defense: firstNumber(p, ["H0D_Creature_DEF_Total_Calc"]),
    speed,
    perception: null,
    states: []
  };
}

function machineStats(p) {
  let hpMax = firstNumber(p, ["H0D_Machine_PV_Max_Calc", "H0D_Machine_PV_Max_Aff"]);
  if (hpMax === null) {
    const base = numberOrNull(p.H0D_Machine_PV_Corps_Base);
    if (base !== null) hpMax = base + numberOrZero(p.H0D_Machine_PV_Bonus_Pieces_Calc);
  }

  let defense = firstNumber(p, ["H0D_Machine_DEF_Total_Calc", "H0D_Machine_DEF_Total_Aff"]);
  if (defense === null) {
    const base = numberOrNull(p.H0D_Machine_DEF_Corps_Base);
    if (base !== null) defense = Math.max(0, base + numberOrZero(p.H0D_Machine_DEF_Bonus_Pieces_Calc) + numberOrZero(p.H0D_Machine_Mod_DEF_Temp));
  }

  let speed = firstNumber(p, ["H0D_Machine_Vitesse_Effective_Calc", "H0D_Machine_Vitesse_Effective_Aff"]);
  if (speed === null) speed = firstNumber(p, ["H0D_Machine_Vitesse_Base"]);

  const states = [];
  if (game.settings.get(MODULE_ID, "showStates")) {
    const stateMap = [
      ["H0D_Machine_Etat_Marquee", "★ Marquée"],
      ["H0D_Machine_Etat_Ralentie", "Ralentie"],
      ["H0D_Machine_Etat_Aveuglee", "Aveuglée"],
      ["H0D_Machine_Etat_Brouillee", "Brouillée"],
      ["H0D_Machine_Etat_Surchargee", "Surchargée"]
    ];
    for (const [key, label] of stateMap) if (truthy(p[key])) states.push(label);
  }

  return {
    typeLabel: "Machine",
    hpCurrent: firstNumber(p, ["H0D_Machine_PV_Actuels", "H0D_Machine_PV_Actuels_Calc"]),
    hpMax,
    defense,
    speed,
    perception: firstNumber(p, ["H0D_Machine_Perception_Effective_Calc", "H0D_Machine_Perception_Effective_Aff"]),
    states
  };
}

function hasAny(obj, keys) {
  return keys.some(key => Object.prototype.hasOwnProperty.call(obj, key));
}

function firstNumber(obj, keys) {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = numberOrNull(obj[key]);
    if (value !== null) return value;
  }
  return null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOrZero(value) {
  return numberOrNull(value) ?? 0;
}

function truthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function signedValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${formatValue(n)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
