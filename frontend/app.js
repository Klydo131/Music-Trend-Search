/**
 * Music Trend Search Engine — Frontend
 * Vanilla JS, no dependencies
 */

const API_BASE = "";  // Same-origin; change to http://localhost:8000 for dev

// ── Safe DOM helpers ───────────────────────────────────────────────────────
/** Escape a string for safe use in HTML text nodes or attributes. */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

/**
 * Validate a CSS color value against a strict allowlist pattern.
 * Agent colors come from the server; reject anything that isn't a safe hex
 * or rgb() value to prevent CSS injection via custom properties.
 */
function safeCssColor(value) {
  return /^#[0-9a-fA-F]{3,8}$|^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(value)
    ? value
    : "#6366f1";  // fallback to default accent
}

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  agents: [],
  selectedAgents: new Set(),
  apiKey: sessionStorage.getItem("mts_api_key") || "",
  loading: false,
};

// ── DOM Refs ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const settingsToggle = $("settingsToggle");
const settingsPanel  = $("settingsPanel");
const apiKeyInput    = $("apiKeyInput");
const saveApiKeyBtn  = $("saveApiKey");
const searchForm     = $("searchForm");
const queryInput     = $("queryInput");
const searchBtn      = $("searchBtn");
const agentsGrid     = $("agentsGrid");
const selectAllBtn   = $("selectAll");
const selectNoneBtn  = $("selectNone");
const resultsSection = $("resultsSection");
const resultsQuery   = $("resultsQuery");
const resultsMeta    = $("resultsMeta");
const resultsGrid    = $("resultsGrid");
const errorBanner    = $("errorBanner");
const errorMsg       = $("errorMsg");
const emptyState     = $("emptyState");

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  if (state.apiKey) apiKeyInput.value = state.apiKey;
  await loadAgents();
}

// ── API Key ────────────────────────────────────────────────────────────────
settingsToggle.addEventListener("click", () => {
  settingsPanel.hidden = !settingsPanel.hidden;
});

saveApiKeyBtn.addEventListener("click", () => {
  state.apiKey = apiKeyInput.value.trim();
  sessionStorage.setItem("mts_api_key", state.apiKey);
  settingsPanel.hidden = true;
  showToast("API key saved for this session.");
});

// ── Load Agents ────────────────────────────────────────────────────────────
async function loadAgents() {
  try {
    const res = await fetch(`${API_BASE}/api/agents`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.agents = data.agents;
    renderAgents();
    // Default: select all agents
    state.agents.forEach((a) => state.selectedAgents.add(a.id));
    updateAgentCards();
  } catch (err) {
    agentsGrid.innerHTML = `<p style="color:var(--text-3);font-size:0.85rem;grid-column:1/-1">
      Could not load agents. Is the backend running?
    </p>`;
    console.error("Failed to load agents:", err);
  }
}

function renderAgents() {
  agentsGrid.innerHTML = "";

  state.agents.forEach((agent) => {
    const card = document.createElement("div");
    card.className = "agent-card";
    // data-id is read back via dataset.id — use textContent-safe assignment
    card.dataset.id = agent.id;
    // CSS custom property for the accent color — validated before use
    card.style.setProperty("--agent-color", safeCssColor(agent.color));
    card.title = agent.tagline;  // .title is a text property, not innerHTML

    const check = document.createElement("div");
    check.className = "agent-check";
    check.textContent = "✓";

    const icon = document.createElement("span");
    icon.className = "agent-icon";
    icon.textContent = agent.icon;  // emoji — textContent is safe

    const name = document.createElement("div");
    name.className = "agent-name";
    name.textContent = agent.name;

    const tagline = document.createElement("div");
    tagline.className = "agent-tagline";
    tagline.textContent = agent.tagline;

    card.append(check, icon, name, tagline);
    card.addEventListener("click", () => toggleAgent(card.dataset.id));
    agentsGrid.appendChild(card);
  });
}

function toggleAgent(id) {
  if (state.selectedAgents.has(id)) {
    state.selectedAgents.delete(id);
  } else {
    state.selectedAgents.add(id);
  }
  updateAgentCards();
}

function updateAgentCards() {
  agentsGrid.querySelectorAll(".agent-card").forEach((card) => {
    card.classList.toggle("selected", state.selectedAgents.has(card.dataset.id));
  });
}

selectAllBtn.addEventListener("click", () => {
  state.agents.forEach((a) => state.selectedAgents.add(a.id));
  updateAgentCards();
});

selectNoneBtn.addEventListener("click", () => {
  state.selectedAgents.clear();
  updateAgentCards();
});

// ── Search ─────────────────────────────────────────────────────────────────
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (state.loading) return;

  const query = queryInput.value.trim();
  if (!query) { queryInput.focus(); return; }

  if (state.selectedAgents.size === 0) {
    showError("Please select at least one agent.");
    return;
  }

  await runSearch(query);
});

async function runSearch(query) {
  state.loading = true;
  setSearchLoading(true);
  hideError();
  emptyState.hidden = true;

  // Show skeleton result cards immediately
  showSkeletonResults(query, [...state.selectedAgents]);

  try {
    const body = {
      query,
      agent_ids: [...state.selectedAgents],
    };
    if (state.apiKey) body.api_key = state.apiKey;

    const res = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    resultsSection.hidden = true;
    showError(err.message || "Search failed. Check the console for details.");
    console.error("Search error:", err);
  } finally {
    state.loading = false;
    setSearchLoading(false);
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function showSkeletonResults(query, agentIds) {
  resultsSection.hidden = false;
  resultsQuery.textContent = `"${query}"`;
  resultsMeta.textContent = `Running ${agentIds.length} agent${agentIds.length !== 1 ? "s" : ""}…`;

  const agentMap = Object.fromEntries(state.agents.map((a) => [a.id, a]));

  resultsGrid.innerHTML = agentIds
    .map((id) => {
      const agent = agentMap[id];
      if (!agent) return "";
      const safeColor = safeCssColor(agent.color);
      return `
        <div class="result-card loading" id="result-${esc(id)}">
          <div class="result-card-accent" style="background:${safeColor}"></div>
          <div class="result-card-header">
            <span class="result-card-icon">${esc(agent.icon)}</span>
            <span class="result-card-name">${esc(agent.name)}</span>
            <span class="result-card-duration">…</span>
          </div>
          <div class="result-card-body"></div>
        </div>`;
    })
    .join("");
}

function renderResults(data) {
  resultsQuery.textContent = `"${data.query}"`;
  resultsMeta.textContent = `${data.results.length} agent${data.results.length !== 1 ? "s" : ""} · ${(data.total_duration_ms / 1000).toFixed(1)}s`;

  data.results.forEach((result, i) => {
    const card = document.getElementById(`result-${result.agent_id}`);
    if (!card) return;

    card.classList.remove("loading");
    card.style.animationDelay = `${i * 0.06}s`;

    card.querySelector(".result-card-duration").textContent = `${(result.duration_ms / 1000).toFixed(1)}s`;
    card.querySelector(".result-card-body").innerHTML = formatMarkdown(result.content);
  });
}

// ── Formatting ─────────────────────────────────────────────────────────────
function formatMarkdown(text) {
  // Basic markdown-to-HTML for agent responses
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Headings: ## Heading
    .replace(/^### (.+)$/gm, '<h4 style="color:var(--text);margin:14px 0 6px;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.04em;">$1</h4>')
    .replace(/^## (.+)$/gm,  '<h3 style="color:var(--text);margin:16px 0 8px;font-size:0.95rem;">$1</h3>')
    .replace(/^# (.+)$/gm,   '<h2 style="color:var(--text);margin:18px 0 10px;font-size:1rem;">$1</h2>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li style="margin-left:16px;margin-bottom:3px;">$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p style="margin-top:10px;">')
    // Single newlines
    .replace(/\n/g, "<br>")
    // Wrap in paragraph
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ── UI Helpers ─────────────────────────────────────────────────────────────
function setSearchLoading(on) {
  searchBtn.disabled = on;
  searchBtn.querySelector(".btn-text").hidden = on;
  searchBtn.querySelector(".btn-spinner").hidden = !on;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.hidden = false;
}

function hideError() {
  errorBanner.hidden = true;
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:#1a1a24;border:1px solid rgba(255,255,255,0.12);
    padding:10px 18px;border-radius:10px;font-size:0.85rem;
    color:#f0f0f8;z-index:999;animation:fadeInUp 0.3s ease;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// ── Boot ───────────────────────────────────────────────────────────────────
init();
