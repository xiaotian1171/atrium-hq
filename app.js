"use strict";

/*
 * Atrium HQ
 * A tower of one-person companies run by public Pollinations Prompt Agents.
 *
 * Security notes:
 * - A visitor's Pollinations key is kept only in sessionStorage.
 * - Saved jobs and draft floors never contain an API key.
 * - Agent output is rendered through the small escaping Markdown renderer below.
 */

// Set this to the app's publishable pk_ key after registering the exact
// GitHub Pages redirect URI in Pollinations. Publishable keys are safe to ship.
const POLLINATIONS_APP_KEY = "pk_bM65ZuBLjP0M9Mvx";
const POLLINATIONS_AUTH_URL = "https://enter.pollinations.ai/authorize";
const POLLINATIONS_TOKEN_URL = "https://enter.pollinations.ai/api/oauth/token";
const POLLINATIONS_USERINFO_URL = "https://enter.pollinations.ai/api/oauth/userinfo";
const POLLINATIONS_CHAT_URL = "https://gen.pollinations.ai/v1/chat/completions";
const DEFAULT_BASE_MODEL = "deepseek/deepseek-v4.1-flash";

const STORAGE = {
  apiKey: "atrium_hq_api_key",
  pkceVerifier: "atrium_hq_pkce_verifier",
  oauthState: "atrium_hq_oauth_state",
  jobs: "atrium_hq_jobs_v1",
  draft: "atrium_hq_draft_floor_v1",
};

const JOB_TYPE_LABELS = {
  research: "Research brief",
  outreach: "Outreach draft",
  build: "Build / product spec",
  report: "Weekly report",
  custom: "Custom assignment",
};

const COMPANY_FLOORS = [
  {
    id: "northstar-climate",
    kind: "company",
    floor: 12,
    name: "Northstar Climate Data",
    founder: "Maya Chen",
    sector: "Climate data",
    color: "#2f7cf6",
    mission: "Turns messy public climate and infrastructure data into decision-ready risk briefs for small operators.",
    services: ["Risk scans", "Data-source audits", "Board briefs"],
    crew: [
      { role: "Scout", detail: "Finds candidate sources and flags freshness" },
      { role: "Analyst", detail: "Reconciles conflicting datasets" },
      { role: "Editor", detail: "Turns caveats into plain decisions" },
    ],
    agentName: "atrium-northstar-climate",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A two-page flood-exposure brief separating observed river-gauge evidence from model estimates, with three mitigation options ranked by cost and confidence.",
    examples: {
      research: "Research the evidence a small logistics operator should review before signing a five-year warehouse lease in a flood-prone district. Separate observed facts, assumptions and missing data.",
      outreach: "Draft a concise outreach email to a regional logistics association offering a paid flood-risk data audit. Do not invent customers or results.",
      build: "Specify a lightweight data-quality dashboard for river-gauge and rainfall feeds, including freshness checks and failure states.",
      report: "Write a weekly owner report template for a climate-data studio covering source health, client questions, risks and decisions needed.",
      custom: "Prepare a decision brief on whether Northstar should add wildfire-smoke exposure to its current flood-risk offer.",
    },
  },
  {
    id: "loop-and-loom",
    kind: "company",
    floor: 11,
    name: "Loop & Loom",
    founder: "Jonas Weber",
    sector: "Indie games",
    color: "#8b5cf6",
    mission: "Runs live-ops research, patch-note drafts and community listening for tiny game teams that cannot hire a full operations desk.",
    services: ["Player-signal digests", "Patch notes", "Event concepts"],
    crew: [
      { role: "Listener", detail: "Clusters player feedback without flattening dissent" },
      { role: "Producer", detail: "Converts signals into scoped work" },
      { role: "Comms", detail: "Drafts honest player-facing updates" },
    ],
    agentName: "atrium-loop-and-loom",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A player-feedback digest that separated a loud balance complaint from a smaller but reproducible save-file bug, then drafted patch notes in the studio's voice.",
    examples: {
      research: "Research a live-event format for a cozy indie farming game that can be built by two people in two weeks. Include risks and measurement ideas.",
      outreach: "Draft a friendly outreach note to a small game studio offering a one-week player-feedback digest. Avoid promising growth.",
      build: "Specify a feedback-triage board for Steam reviews, Discord reports and support email, with duplicate handling and severity rules.",
      report: "Create a weekly live-ops report structure covering player signals, shipped fixes, community risks and one decision for the founder.",
      custom: "Turn these themes into three testable event concepts: players want more co-op goals, shorter sessions and collectible room decorations.",
    },
  },
  {
    id: "clearclause",
    kind: "company",
    floor: 10,
    name: "ClearClause Studio",
    founder: "Priya Nair",
    sector: "Contract operations",
    color: "#0ea5a4",
    mission: "Prepares contract summaries, obligation calendars and negotiation question lists for founders. It supports operations; it does not provide legal advice.",
    services: ["Clause maps", "Obligation calendars", "Question lists"],
    crew: [
      { role: "Reader", detail: "Extracts parties, dates and obligations" },
      { role: "Checker", detail: "Finds undefined terms and inconsistencies" },
      { role: "Briefing", detail: "Prepares questions for a qualified adviser" },
    ],
    agentName: "atrium-clearclause",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A vendor-agreement map showing renewal notice dates, liability caps and data-return duties, followed by questions for the founder's lawyer.",
    examples: {
      research: "Create a checklist of operational clauses a founder should locate in a SaaS vendor agreement before asking a lawyer to review it. Make clear this is not legal advice.",
      outreach: "Draft an outreach email to startup founders offering a contract-obligation calendar. Be explicit that ClearClause does not provide legal advice.",
      build: "Specify a clause-map workspace that tracks renewal dates, notice windows, owners and unresolved questions without storing full contracts by default.",
      report: "Write a weekly contract-operations report template with upcoming deadlines, blocked reviews and decisions needed.",
      custom: "Turn a hypothetical 24-month auto-renewing vendor deal into an obligation calendar and a list of questions for qualified counsel.",
    },
  },
  {
    id: "papertrail-bio",
    kind: "company",
    floor: 9,
    name: "PaperTrail Bio",
    founder: "Dr. Elena Petrova",
    sector: "Research synthesis",
    color: "#22a06b",
    mission: "Synthesizes biomedical literature into traceable evidence tables, keeping claims tied to study design and uncertainty.",
    services: ["Evidence tables", "Literature maps", "Methods checks"],
    crew: [
      { role: "Searcher", detail: "Builds transparent search strategies" },
      { role: "Methodologist", detail: "Checks design, bias and endpoints" },
      { role: "Synthesizer", detail: "Writes claims only as far as evidence allows" },
    ],
    agentName: "atrium-papertrail-bio",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "An evidence table comparing three study designs for a biomarker claim, with population, endpoint, limitations and the exact claim each paper can support.",
    examples: {
      research: "Design a literature-search and evidence-table plan for evaluating whether a blood biomarker predicts treatment response. Do not fabricate papers or findings.",
      outreach: "Draft outreach to a small biotech team offering a traceable literature map before their next experiment. Avoid medical claims.",
      build: "Specify an evidence-table tool that forces every claim to link to a study design, population, endpoint and limitation.",
      report: "Create a weekly research-synthesis report template covering new evidence, contradictions, retractions to check and decisions needed.",
      custom: "Explain how PaperTrail would evaluate a vendor claim that a screening test is 'clinically proven', including red flags and missing evidence.",
    },
  },
  {
    id: "shelflife",
    kind: "company",
    floor: 8,
    name: "ShelfLife",
    founder: "Marco Ruiz",
    sector: "Creator commerce",
    color: "#f59e0b",
    mission: "Helps independent creators plan product drops, understand audience signals and keep shop operations calm.",
    services: ["Drop calendars", "Audience digests", "Product-page drafts"],
    crew: [
      { role: "Merchandiser", detail: "Sequences products and bundles" },
      { role: "Listener", detail: "Summarizes comments and support themes" },
      { role: "Copy desk", detail: "Drafts clear product and launch copy" },
    ],
    agentName: "atrium-shelflife",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A four-week drop calendar built around production capacity, shipping cutoffs and the audience questions most likely to block checkout.",
    examples: {
      research: "Research a low-risk product-drop plan for an illustrator with 8,000 followers and only six hours a week for fulfilment.",
      outreach: "Draft outreach to independent illustrators offering a drop-readiness audit. Do not promise sales.",
      build: "Specify a drop-planning board covering inventory, production deadlines, shipping cutoffs and launch-day support macros.",
      report: "Write a weekly creator-commerce report template covering audience signals, stock risks, support themes and founder decisions.",
      custom: "Turn audience requests for prints, stickers and a desk calendar into a sequenced test plan with explicit capacity limits.",
    },
  },
  {
    id: "civic-atlas",
    kind: "company",
    floor: 7,
    name: "Civic Atlas",
    founder: "Amina Diallo",
    sector: "Public data",
    color: "#38bdf8",
    mission: "Makes public-service data legible through maps, local guides and careful explanations of what the data cannot prove.",
    services: ["Service maps", "Data explainers", "Access audits"],
    crew: [
      { role: "Mapper", detail: "Structures places and service areas" },
      { role: "Explainer", detail: "Writes for residents, not dashboards" },
      { role: "Auditor", detail: "Checks coverage gaps and stale records" },
    ],
    agentName: "atrium-civic-atlas",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A neighbourhood access brief mapping evening clinic hours against bus frequency, with stale listings clearly marked instead of silently averaged away.",
    examples: {
      research: "Plan a public-data audit for evening healthcare access in a mid-sized city. Include data sources to verify and known coverage traps.",
      outreach: "Draft outreach to a local newsroom offering a resident-friendly map of public-service opening hours and transit access.",
      build: "Specify a service-access atlas with freshness badges, source history, accessibility filters and correction workflows.",
      report: "Create a weekly public-data quality report template covering stale records, broken feeds, correction requests and publication decisions.",
      custom: "Explain how Civic Atlas would communicate uncertainty when two official datasets disagree about a clinic's opening hours.",
    },
  },
  {
    id: "tinyfactory",
    kind: "company",
    floor: 6,
    name: "TinyFactory",
    founder: "Kenji Sato",
    sector: "Product prototyping",
    color: "#fb7185",
    mission: "Turns rough hardware and software ideas into testable prototype plans, bills of materials and build-week checklists.",
    services: ["Prototype plans", "BOM reviews", "Test checklists"],
    crew: [
      { role: "Planner", detail: "Scopes the smallest useful test" },
      { role: "Parts desk", detail: "Checks interfaces and missing pieces" },
      { role: "QA", detail: "Writes observable pass/fail tests" },
    ],
    agentName: "atrium-tinyfactory",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A one-week prototype plan for a desk air-quality beacon, with a parts table, three failure tests and a go/no-go decision point.",
    examples: {
      research: "Research a one-week prototype plan for a battery-powered desk air-quality beacon. Separate must-test assumptions from nice-to-have features.",
      outreach: "Draft outreach to hardware-curious software founders offering a prototype-readiness review. Do not claim manufacturing capability.",
      build: "Specify a prototype tracker covering assumptions, parts, interfaces, test evidence and decision gates.",
      report: "Write a build-week report template covering tests run, failures, parts risk, next experiments and decisions needed.",
      custom: "Turn a vague idea for a smart plant-watering tray into the smallest useful prototype and three observable tests.",
    },
  },
  {
    id: "soundpost",
    kind: "company",
    floor: 5,
    name: "SoundPost",
    founder: "Nora Lindqvist",
    sector: "Audio production",
    color: "#a78bfa",
    mission: "Supports independent podcasters with research packs, edit plans, show notes and repurposing briefs that preserve the host's voice.",
    services: ["Episode research", "Edit plans", "Show notes"],
    crew: [
      { role: "Researcher", detail: "Prepares sourced talking points" },
      { role: "Editor", detail: "Marks structure, cuts and inserts" },
      { role: "Publisher", detail: "Drafts notes and chapter summaries" },
    ],
    agentName: "atrium-soundpost",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "An episode pack with a claims-to-verify list, a tighter cold open, chapter markers and show notes written in the host's established tone.",
    examples: {
      research: "Build a research-pack outline for a podcast episode about why local newspapers are experimenting with audio editions. Mark claims that need verification.",
      outreach: "Draft outreach to independent podcasters offering episode research and show-note support without changing their editorial voice.",
      build: "Specify an episode-production board covering research claims, edit decisions, assets, fact checks and publication approval.",
      report: "Create a weekly podcast operations report template covering episodes in production, blocked fact checks, audience questions and decisions.",
      custom: "Turn a rambling 70-minute interview plan into a tighter 35-minute episode structure with a cold open and chapter plan.",
    },
  },
  {
    id: "fieldnotes-ai",
    kind: "company",
    floor: 4,
    name: "FieldNotes AI",
    founder: "Sam Okafor",
    sector: "Customer research",
    color: "#34d399",
    mission: "Converts interviews, support tickets and field observations into evidence-linked product decisions.",
    services: ["Interview synthesis", "Signal maps", "Decision memos"],
    crew: [
      { role: "Synthesis", detail: "Clusters observations with source links" },
      { role: "Skeptic", detail: "Looks for contradictory evidence" },
      { role: "Memo writer", detail: "Frames options and trade-offs" },
    ],
    agentName: "atrium-fieldnotes",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A decision memo that kept power-user requests separate from first-run confusion and tied every recommendation back to an interview or ticket.",
    examples: {
      research: "Design a two-week customer-research sprint for a B2B onboarding problem. Include recruiting criteria, interview prompts and synthesis rules.",
      outreach: "Draft outreach to a seed-stage SaaS founder offering an evidence-linked synthesis of existing support tickets.",
      build: "Specify a field-notes workspace where every insight keeps a source quote, confidence level and contradictory evidence slot.",
      report: "Write a weekly customer-signal report template covering new evidence, contradictions, churn risks and one founder decision.",
      custom: "Given requests for more automation and complaints that the product feels opaque, frame three product options with trade-offs and evidence to collect.",
    },
  },
  {
    id: "mise-en-place",
    kind: "company",
    floor: 3,
    name: "Mise en Place",
    founder: "Camille Laurent",
    sector: "Restaurant operations",
    color: "#f97316",
    mission: "Helps small restaurants turn reviews, bookings and prep notes into calmer weeks and better experiments.",
    services: ["Review digests", "Prep planning", "Menu experiments"],
    crew: [
      { role: "Review desk", detail: "Finds repeat guest friction" },
      { role: "Prep planner", detail: "Balances demand against staff capacity" },
      { role: "Experimenter", detail: "Designs one change at a time" },
    ],
    agentName: "atrium-mise-en-place",
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Sample finished job",
    sample: "A Monday prep brief that connected repeated 'slow desserts' reviews to one station bottleneck and proposed a single measurable service experiment.",
    examples: {
      research: "Research a four-week experiment plan for a 36-seat bistro whose guests praise the food but complain about slow desserts.",
      outreach: "Draft outreach to independent restaurant owners offering a weekly review-to-prep brief. Keep it practical and free of hype.",
      build: "Specify a prep-planning board that joins bookings, review themes, station capacity and one active service experiment.",
      report: "Create a weekly restaurant operations report covering guest friction, prep misses, staffing pressure and the owner's next experiment.",
      custom: "Turn mixed reviews about noise, slow desserts and excellent bread into three prioritized operational experiments.",
    },
  },
];

const LOBBY = {
  id: "atrium-concierge",
  kind: "concierge",
  floor: 1,
  name: "Atrium Concierge",
  founder: "Atrium HQ",
  sector: "Building guide",
  color: "#64748b",
  mission: "Helps visitors choose the right floor, understand what each company can do, and prepare a clear assignment.",
  services: ["Floor matching", "Assignment shaping", "Building questions"],
  crew: [
    { role: "Concierge", detail: "Routes visitors to the right company" },
    { role: "Brief writer", detail: "Turns a vague ask into a usable assignment" },
  ],
  agentName: "atrium-concierge",
  baseModel: DEFAULT_BASE_MODEL,
  sampleTitle: "What to ask",
  sample: "Tell the concierge your goal, deadline and what a useful result looks like. It will recommend a floor and draft the assignment for that company's Agent.",
  examples: {
    research: "I need help understanding whether a small warehouse is exposed to flooding. Which Atrium HQ floor should I use, and what assignment should I give it?",
    outreach: "Help me choose a floor for drafting outreach to independent podcasters, then write the assignment I should send that floor.",
    build: "I want a prototype plan for a desk air-quality beacon. Recommend a floor and turn this into a precise build assignment.",
    report: "Recommend a floor for a weekly customer-signal report and draft the exact assignment, including what evidence I should provide.",
    custom: "I have a vague business problem. Ask me the minimum clarifying questions and recommend the best Atrium HQ floor.",
  },
};

const $ = (id) => document.getElementById(id);
const els = {
  connectionStatus: $("connectionStatus"),
  connectButton: $("connectButton"),
  disconnectButton: $("disconnectButton"),
  statCompanies: $("statCompanies"),
  directorySearch: $("directorySearch"),
  sectorFilter: $("sectorFilter"),
  directoryList: $("directoryList"),
  directoryCount: $("directoryCount"),
  directoryEmpty: $("directoryEmpty"),
  towerScene: $("towerScene"),
  building: $("building"),
  elevatorCar: $("elevatorCar"),
  resetViewButton: $("resetViewButton"),
  dayNightButton: $("dayNightButton"),
  floorPicker: $("floorPicker"),
  officeFloorBadge: $("officeFloorBadge"),
  officeDetail: $("officeDetail"),
  selectedAgentModel: $("selectedAgentModel"),
  jobForm: $("jobForm"),
  jobType: $("jobType"),
  jobPrompt: $("jobPrompt"),
  runJobButton: $("runJobButton"),
  loadExampleButton: $("loadExampleButton"),
  jobStatus: $("jobStatus"),
  manualKeyPanel: $("manualKeyPanel"),
  manualApiKey: $("manualApiKey"),
  saveManualKeyButton: $("saveManualKeyButton"),
  jobBoard: $("jobBoard"),
  clearJobsButton: $("clearJobsButton"),
  nextFloorBadge: $("nextFloorBadge"),
  rentForm: $("rentForm"),
  rentCompany: $("rentCompany"),
  rentFounder: $("rentFounder"),
  rentSector: $("rentSector"),
  rentColor: $("rentColor"),
  rentMission: $("rentMission"),
  rentServices: $("rentServices"),
  rentTemplate: $("rentTemplate"),
  rentHumanGate: $("rentHumanGate"),
  removeDraftButton: $("removeDraftButton"),
  rentStatus: $("rentStatus"),
  agentBlueprint: $("agentBlueprint"),
  copyBlueprintButton: $("copyBlueprintButton"),
  downloadBlueprintButton: $("downloadBlueprintButton"),
};

let draftFloor = loadDraftFloor();
let entities = buildEntities();
let selectedId = COMPANY_FLOORS[0].id;
let jobs = loadJobs();
let lastExample = "";
let suppressNextFloorClick = false;

function buildEntities() {
  return [...COMPANY_FLOORS, ...(draftFloor ? [draftFloor] : []), LOBBY];
}

function agentModelId(entity) {
  if (!entity || entity.kind === "draft" && !entity.agentModel) return null;
  return entity.agentModel || `community/xiaotian1171/${entity.agentName}`;
}

function selectedEntity() {
  return entities.find((entity) => entity.id === selectedId) || entities[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  const slug = String(value || "my-company")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "my-company";
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return String(value || "");
  }
}

function setStatus(element, message, tone = "") {
  element.textContent = message || "";
  element.className = `status-note ${tone}`.trim();
}

function loadJobs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.jobs) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((job) => {
      if (job && (job.status === "running" || job.status === "revision-running")) {
        return { ...job, status: "failed", error: "This run was interrupted when the page closed. Run it again when ready." };
      }
      return job;
    });
  } catch {
    return [];
  }
}

function saveJobs() {
  try {
    localStorage.setItem(STORAGE.jobs, JSON.stringify(jobs.slice(0, 40)));
  } catch {
    // Storage can be unavailable in private browsing; the live board still works.
  }
}

function loadDraftFloor() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.draft) || "null");
    return parsed && typeof parsed === "object" && parsed.kind === "draft" ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraftFloor() {
  try {
    if (draftFloor) localStorage.setItem(STORAGE.draft, JSON.stringify(draftFloor));
    else localStorage.removeItem(STORAGE.draft);
  } catch {
    // Ignore unavailable storage; the draft remains visible for this page.
  }
}

function renderSectorFilter() {
  const current = els.sectorFilter.value || "all";
  const sectors = [...new Set(entities.filter((entity) => entity.kind !== "concierge").map((entity) => entity.sector))].sort();
  els.sectorFilter.innerHTML = `<option value="all">All sectors</option>` + sectors.map((sector) => `<option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>`).join("");
  els.sectorFilter.value = sectors.includes(current) ? current : "all";
}

function visibleCompanies() {
  const query = els.directorySearch.value.trim().toLowerCase();
  const sector = els.sectorFilter.value;
  return entities
    .filter((entity) => entity.kind === "company" || entity.kind === "draft")
    .filter((entity) => sector === "all" || entity.sector === sector)
    .filter((entity) => {
      if (!query) return true;
      const blob = [entity.name, entity.founder, entity.sector, entity.mission, ...(entity.services || [])].join(" ").toLowerCase();
      return blob.includes(query);
    })
    .sort((a, b) => b.floor - a.floor);
}

function renderDirectory() {
  const companies = visibleCompanies();
  const totalCompanies = entities.filter((entity) => entity.kind === "company" || entity.kind === "draft").length;
  els.statCompanies.textContent = String(totalCompanies);
  els.directoryCount.textContent = `${companies.length} of ${totalCompanies} floors`;
  els.directoryEmpty.classList.toggle("hidden", companies.length !== 0);
  els.directoryList.innerHTML = companies.map((entity) => `
    <button class="company-card" type="button" role="option" data-select-floor="${escapeHtml(entity.id)}"
      aria-selected="${entity.id === selectedId}" style="--company-color:${escapeHtml(entity.color)}">
      <span class="company-card-top">
        <span class="company-name">${escapeHtml(entity.name)}</span>
        <span class="company-floor">F${String(entity.floor).padStart(2, "0")}</span>
      </span>
      <span class="company-mission">${escapeHtml(entity.mission)}</span>
      <span class="tag-row">${(entity.services || []).slice(0, 3).map((service) => `<span class="tag">${escapeHtml(service)}</span>`).join("")}</span>
    </button>
  `).join("");
}

function floorFace(entity, highestFloor) {
  const selected = entity.id === selectedId;
  const floorLabel = entity.kind === "concierge" ? "LOBBY · CONCIERGE" : entity.name;
  const frontTag = entity.kind === "commons" ? "div" : "button";
  const buttonAttrs = entity.kind === "commons" ? "" : `type="button" data-select-floor="${escapeHtml(entity.id)}" aria-label="Visit floor ${entity.floor}: ${escapeHtml(entity.name)}"`;
  return `
    <div class="floor3d ${selected ? "selected" : ""} ${entity.kind === "concierge" ? "lobby" : ""}" style="--floor-color:${escapeHtml(entity.color)}" data-floor-shell="${escapeHtml(entity.id)}">
      ${entity.floor === highestFloor ? `<div class="floor-face floor-top" aria-hidden="true"></div>` : ""}
      <${frontTag} class="floor-face floor-front" ${buttonAttrs}>
        <span class="floor-number">F${String(entity.floor).padStart(2, "0")}</span>
        <span class="floor-name">${escapeHtml(floorLabel)}</span>
        <span class="floor-windows" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </${frontTag}>
      <div class="floor-face floor-side" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
  `;
}

function renderBuilding() {
  const commons = {
    id: "commons",
    kind: "commons",
    floor: 2,
    name: "Atrium Commons",
    color: "#9db4ce",
  };
  const buildingEntities = [...entities, commons].sort((a, b) => b.floor - a.floor);
  const highestFloor = Math.max(...buildingEntities.map((entity) => entity.floor));
  els.building.innerHTML = `<div class="building-sign">ATRIUM HQ</div>` + buildingEntities.map((entity) => floorFace(entity, highestFloor)).join("");
  els.floorPicker.innerHTML = entities
    .slice()
    .sort((a, b) => b.floor - a.floor)
    .map((entity) => `<option value="${escapeHtml(entity.id)}">F${String(entity.floor).padStart(2, "0")} — ${escapeHtml(entity.name)}</option>`)
    .join("");
  els.floorPicker.value = selectedId;
  updateElevator();
}

function updateElevator() {
  const entity = selectedEntity();
  const floors = entities.map((item) => item.floor);
  const min = Math.min(...floors, 1);
  const max = Math.max(...floors, 12);
  const ratio = max === min ? 0 : (max - entity.floor) / (max - min);
  els.elevatorCar.style.top = `${8 + ratio * 84}%`;
  els.elevatorCar.textContent = String(entity.floor);
}

function renderOffice() {
  const entity = selectedEntity();
  const modelId = agentModelId(entity);
  els.officeFloorBadge.textContent = `F${String(entity.floor).padStart(2, "0")}`;
  els.selectedAgentModel.textContent = modelId || "Draft only — provision the blueprint to publish this floor's Agent";
  els.officeDetail.innerHTML = `
    <div class="office-hero" style="--company-color:${escapeHtml(entity.color)}">
      <p class="panel-kicker"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(entity.sector)}</p>
      <h3>${escapeHtml(entity.name)}</h3>
      <p class="office-founder">Founder: ${escapeHtml(entity.founder)}</p>
      <p class="office-mission">${escapeHtml(entity.mission)}</p>
      <div class="office-actions">
        <a class="button button-primary button-small" href="#workbench">Commission this floor</a>
        ${entity.kind === "draft" ? `<a class="button button-small" href="#rent">Review Agent blueprint</a>` : ""}
      </div>
    </div>

    <div class="office-section">
      <h4>Services</h4>
      <div class="tag-row">${(entity.services || []).map((service) => `<span class="tag">${escapeHtml(service)}</span>`).join("")}</div>
    </div>

    <div class="office-section">
      <h4>Agent crew</h4>
      ${(entity.crew || []).map((member) => `<p><strong>${escapeHtml(member.role)}:</strong> ${escapeHtml(member.detail)}</p>`).join("")}
    </div>

    <div class="office-section">
      <h4>Pollinations Agent</h4>
      ${modelId ? `<code class="agent-model">${escapeHtml(modelId)}</code>` : `<p class="muted">This draft floor is visible locally. Its lead Agent still needs to be created from the exported blueprint before it can accept paid work.</p>`}
    </div>

    <div class="office-section">
      <h4>${escapeHtml(entity.sampleTitle || "Sample finished job")}</h4>
      <div class="sample-output" style="--company-color:${escapeHtml(entity.color)}">${escapeHtml(entity.sample || "")}</div>
    </div>
  `;
}

function currentExample() {
  const entity = selectedEntity();
  return entity.examples?.[els.jobType.value] || entity.examples?.custom || "";
}

function refreshExample(force = false) {
  const example = currentExample();
  if (force || !els.jobPrompt.value.trim() || els.jobPrompt.value === lastExample) {
    els.jobPrompt.value = example;
  }
  lastExample = example;
}

function selectFloor(id, options = {}) {
  const next = entities.find((entity) => entity.id === id);
  if (!next) return;
  selectedId = id;
  renderDirectory();
  renderBuilding();
  renderOffice();
  refreshExample(Boolean(options.forceExample));
  setStatus(els.jobStatus, "");
}

function getApiKey() {
  try {
    return sessionStorage.getItem(STORAGE.apiKey) || "";
  } catch {
    return "";
  }
}

function setApiKey(key) {
  try {
    if (key) sessionStorage.setItem(STORAGE.apiKey, key);
    else sessionStorage.removeItem(STORAGE.apiKey);
  } catch {
    // The app can still explain the connection requirement.
  }
  updateConnectionUi();
}

function updateConnectionUi(username = "") {
  const connected = Boolean(getApiKey());
  els.connectButton.classList.toggle("hidden", connected);
  els.disconnectButton.classList.toggle("hidden", !connected);
  els.connectionStatus.classList.toggle("connected", connected);
  els.connectionStatus.textContent = connected ? `Connected${username ? ` as ${username}` : " for this tab"}` : "Not connected";
}

function base64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomToken(length = 48) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function redirectUri() {
  return `${location.origin}${location.pathname}`;
}

async function startConnect() {
  if (!POLLINATIONS_APP_KEY) {
    els.manualKeyPanel.open = true;
    setStatus(els.jobStatus, "This build does not have a publishable App Key configured yet. Use your own Pollinations key for this tab, or finish the developer App Key setup described in the README.", "error");
    els.manualApiKey.focus();
    return;
  }
  const verifier = randomToken(48);
  const state = randomToken(24);
  sessionStorage.setItem(STORAGE.pkceVerifier, verifier);
  sessionStorage.setItem(STORAGE.oauthState, state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: POLLINATIONS_APP_KEY,
    redirect_uri: redirectUri(),
    scope: "profile usage",
    models: "text",
    budget: "5",
    expiry: "7",
    state,
    code_challenge: await sha256Base64Url(verifier),
    code_challenge_method: "S256",
  });
  location.assign(`${POLLINATIONS_AUTH_URL}?${params}`);
}

async function exchangeCode(code) {
  const verifier = sessionStorage.getItem(STORAGE.pkceVerifier) || "";
  if (!verifier || !POLLINATIONS_APP_KEY) throw new Error("The saved PKCE verifier or App Key is missing. Start Connect again.");
  const response = await fetch(POLLINATIONS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: POLLINATIONS_APP_KEY,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Token exchange failed (${response.status}).`);
  }
  sessionStorage.removeItem(STORAGE.pkceVerifier);
  sessionStorage.removeItem(STORAGE.oauthState);
  setApiKey(data.access_token);
}

async function handleAuthReturn() {
  const url = new URL(location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || hash.get("state");
  const expectedState = sessionStorage.getItem(STORAGE.oauthState);
  const legacyKey = hash.get("api_key");
  const authError = url.searchParams.get("error") || hash.get("error");

  if (!code && !legacyKey && !authError) return;

  try {
    if (expectedState && state && state !== expectedState) throw new Error("OAuth state did not match. Connection was cancelled.");
    if (authError) throw new Error(`Pollinations authorization returned: ${authError}`);
    if (legacyKey) setApiKey(legacyKey);
    else if (code) await exchangeCode(code);
    setStatus(els.jobStatus, "Connected. Your scoped key stays in this tab and pays only for runs you start.", "success");
  } catch (error) {
    setStatus(els.jobStatus, error.message || "Connection failed.", "error");
  } finally {
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    url.hash = "";
    history.replaceState({}, document.title, url);
  }
}

async function refreshUserInfo() {
  const key = getApiKey();
  if (!key) {
    updateConnectionUi();
    return;
  }
  updateConnectionUi();
  try {
    const response = await fetch(POLLINATIONS_USERINFO_URL, { headers: { Authorization: `Bearer ${key}` } });
    if (response.status === 401 || response.status === 403) {
      setApiKey("");
      setStatus(els.jobStatus, "The saved session key is no longer valid. Connect again.", "error");
      return;
    }
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      updateConnectionUi(data.preferred_username || data.name || "");
    }
  } catch {
    // Userinfo is a convenience; generation errors will be reported on the run itself.
  }
}

function extractChatText(data) {
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  }
  return "";
}

async function callAgent(entity, prompt) {
  const key = getApiKey();
  const modelId = agentModelId(entity);
  if (!key) {
    const error = new Error("Connect Pollinations or use your own API key before running a floor.");
    error.code = "NOT_CONNECTED";
    throw error;
  }
  if (!modelId) {
    const error = new Error("This draft floor does not have a provisioned Pollinations Agent yet. Create it from the blueprint first; Atrium HQ will not fake the run with a generic model.");
    error.code = "AGENT_NOT_PROVISIONED";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(POLLINATIONS_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nReturn a review-ready result with:\n1. Result\n2. Evidence, assumptions and limits\n3. Recommended next actions\n4. Decision needed from the human\n\nDo not claim that you contacted anyone, published anything, used information you were not given, or completed an external action unless the assignment supplied evidence that it happened.`,
          },
        ],
        temperature: 0.4,
        reasoning_effort: "none",
        max_tokens: 1800,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || data?.error || data?.message || `Pollinations returned HTTP ${response.status}.`;
      const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
      error.status = response.status;
      throw error;
    }
    const text = extractChatText(data);
    if (!text) throw new Error("The Agent returned an empty result. No job output was invented.");
    return text;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The Agent run timed out after 120 seconds. Try a narrower assignment.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function formatInlineMarkdown(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = null;
  let inCode = false;
  let codeBuffer = [];

  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      html.push(`<h${level}>${formatInlineMarkdown(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^\s*[-*•]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const type = unordered ? "ul" : "ol";
      if (listType !== type) {
        closeList();
        html.push(`<${type}>`);
        listType = type;
      }
      html.push(`<li>${formatInlineMarkdown(escapeHtml((unordered || ordered)[1]))}</li>`);
      continue;
    }
    closeList();
    if (/^\s*---+\s*$/.test(line)) {
      html.push("<hr>");
    } else {
      html.push(`<p>${formatInlineMarkdown(escapeHtml(line.trim()))}</p>`);
    }
  }
  if (inCode) html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  closeList();
  return html.join("\n") || "<p>No output yet.</p>";
}

function jobStatusLabel(job) {
  return {
    running: "Running",
    "revision-running": "Revising",
    "needs-decision": "Needs decision",
    approved: "Approved",
    failed: "Failed",
  }[job.status] || job.status;
}

function renderJobs() {
  if (!jobs.length) {
    els.jobBoard.innerHTML = `<div class="empty-jobs">No commissions yet. Choose a floor, connect a wallet, and run its Agent.</div>`;
    return;
  }
  els.jobBoard.innerHTML = jobs.map((job) => {
    const running = job.status === "running" || job.status === "revision-running";
    return `
      <article class="job-card ${escapeHtml(job.status)}" data-job-card="${escapeHtml(job.id)}">
        <div class="job-card-top">
          <div>
            <h4>${running ? `<span class="spinner" aria-hidden="true"></span>` : ""}${escapeHtml(job.companyName)} — ${escapeHtml(JOB_TYPE_LABELS[job.type] || job.type)}</h4>
            <div class="job-meta">${escapeHtml(formatDate(job.createdAt))} · <code>${escapeHtml(job.agentModel || "not provisioned")}</code></div>
          </div>
          <span class="job-status">${escapeHtml(jobStatusLabel(job))}</span>
        </div>
        <p class="job-assignment"><strong>Assignment:</strong> ${escapeHtml(job.assignment)}</p>
        ${job.output ? `<div class="job-output">${renderMarkdown(job.output)}</div>` : ""}
        ${job.error ? `<div class="job-output"><strong>Run failed.</strong><p>${escapeHtml(job.error)}</p></div>` : ""}
        ${job.status === "needs-decision" ? `
          <div class="job-decision">
            <label class="field-label" for="feedback-${escapeHtml(job.id)}">Revision note (only needed if you send it back)</label>
            <textarea id="feedback-${escapeHtml(job.id)}" class="text-input" placeholder="What should the Agent change?"></textarea>
            <div class="form-row">
              <button class="button button-primary button-small" type="button" data-job-action="approve" data-job-id="${escapeHtml(job.id)}">Approve draft</button>
              <button class="button button-small" type="button" data-job-action="revise" data-job-id="${escapeHtml(job.id)}">Request revision</button>
            </div>
          </div>
        ` : ""}
        ${job.status === "failed" ? `
          <div class="form-row">
            <button class="button button-small" type="button" data-job-action="retry" data-job-id="${escapeHtml(job.id)}">Retry this assignment</button>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

async function executeJob(job, prompt) {
  const entity = entities.find((item) => item.id === job.companyId) || selectedEntity();
  job.status = job.output ? "revision-running" : "running";
  job.error = "";
  job.updatedAt = new Date().toISOString();
  saveJobs();
  renderJobs();
  try {
    const output = await callAgent(entity, prompt);
    job.output = output;
    job.status = "needs-decision";
    job.updatedAt = new Date().toISOString();
    setStatus(els.jobStatus, `${entity.name} finished. Review the draft in the human decision queue.`, "success");
  } catch (error) {
    job.status = "failed";
    job.error = error.message || "The Agent run failed.";
    job.updatedAt = new Date().toISOString();
    setStatus(els.jobStatus, job.error, "error");
    if (error.code === "NOT_CONNECTED") {
      els.manualKeyPanel.open = true;
    }
  } finally {
    saveJobs();
    renderJobs();
    els.runJobButton.disabled = false;
  }
}

async function submitJob(event) {
  event.preventDefault();
  const entity = selectedEntity();
  const assignment = els.jobPrompt.value.trim();
  if (!assignment) return;
  const job = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    companyId: entity.id,
    companyName: entity.name,
    agentModel: agentModelId(entity),
    type: els.jobType.value,
    assignment,
    status: "running",
    output: "",
    error: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.unshift(job);
  saveJobs();
  renderJobs();
  els.runJobButton.disabled = true;
  setStatus(els.jobStatus, `Running ${entity.name}'s Agent…`);
  await executeJob(job, `${JOB_TYPE_LABELS[job.type] || "Assignment"} for ${entity.name}:\n\n${assignment}`);
}

async function handleJobAction(event) {
  const button = event.target.closest("[data-job-action]");
  if (!button) return;
  const job = jobs.find((item) => item.id === button.dataset.jobId);
  if (!job) return;
  const action = button.dataset.jobAction;

  if (action === "approve") {
    job.status = "approved";
    job.updatedAt = new Date().toISOString();
    saveJobs();
    renderJobs();
    setStatus(els.jobStatus, "Draft approved locally. Atrium HQ does not send or publish it for you.", "success");
    return;
  }

  if (action === "retry") {
    const entity = entities.find((item) => item.id === job.companyId) || selectedEntity();
    setStatus(els.jobStatus, `Retrying ${entity.name}'s Agent…`);
    await executeJob(job, `${JOB_TYPE_LABELS[job.type] || "Assignment"} for ${entity.name}:\n\n${job.assignment}`);
    return;
  }

  if (action === "revise") {
    const feedback = document.getElementById(`feedback-${job.id}`)?.value.trim();
    if (!feedback) {
      setStatus(els.jobStatus, "Add a revision note so the Agent knows what to change.", "error");
      document.getElementById(`feedback-${job.id}`)?.focus();
      return;
    }
    const entity = entities.find((item) => item.id === job.companyId) || selectedEntity();
    const prompt = `Revise your previous draft for this assignment.\n\nOriginal assignment:\n${job.assignment}\n\nPrevious draft:\n${job.output}\n\nHuman revision note:\n${feedback}\n\nReturn the complete revised draft, not a diff.`;
    setStatus(els.jobStatus, `Asking ${entity.name} to revise the draft…`);
    await executeJob(job, prompt);
  }
}

const RENT_TEMPLATES = {
  operator: {
    crew: [
      { role: "Operator", detail: "Plans and executes the daily desk" },
      { role: "Researcher", detail: "Collects and labels evidence" },
      { role: "Reporter", detail: "Returns concise owner updates" },
    ],
    instruction: "Act as the operating desk for a one-person company. Break each assignment into research, production and reporting steps. Prefer small finished drafts over broad advice.",
  },
  research: {
    crew: [
      { role: "Searcher", detail: "Defines a transparent evidence strategy" },
      { role: "Analyst", detail: "Separates facts, inference and gaps" },
      { role: "Synthesizer", detail: "Writes traceable decision briefs" },
    ],
    instruction: "Act as a careful research studio. Never invent sources or findings. Distinguish supplied evidence, general reasoning, assumptions and missing information.",
  },
  builder: {
    crew: [
      { role: "Planner", detail: "Scopes the smallest useful build" },
      { role: "Builder", detail: "Produces specs and implementation steps" },
      { role: "QA", detail: "Defines observable pass/fail checks" },
    ],
    instruction: "Act as a product-building studio. Turn assignments into scoped plans, specifications, checklists and testable next steps. Call out dependencies and failure modes.",
  },
  concierge: {
    crew: [
      { role: "Intake", detail: "Clarifies the request and constraints" },
      { role: "Router", detail: "Chooses the right workflow" },
      { role: "Follow-up", detail: "Summarizes status and next actions" },
    ],
    instruction: "Act as a client concierge and operations coordinator. Clarify only when necessary, route work into concrete steps, and keep the human owner informed.",
  },
};

function rentFormValues() {
  return {
    company: els.rentCompany.value.trim() || "Signal Pantry",
    founder: els.rentFounder.value.trim() || "Alex Rivera",
    sector: els.rentSector.value.trim() || "Food data",
    color: els.rentColor.value,
    mission: els.rentMission.value.trim() || "Turns restaurant reviews into a weekly menu experiment backlog.",
    services: els.rentServices.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6),
    template: els.rentTemplate.value,
    humanGate: els.rentHumanGate.checked,
  };
}

function buildBlueprint(values = rentFormValues()) {
  const template = RENT_TEMPLATES[values.template] || RENT_TEMPLATES.operator;
  const agentName = `atrium-${slugify(values.company)}`.slice(0, 120);
  const title = `${values.company} Lead Agent`.slice(0, 42);
  const services = values.services.length ? values.services.join(", ") : "Research, drafting and reporting";
  const humanGate = values.humanGate
    ? "Every result is a draft for the human owner. Clearly state the decision or approval needed before anything is sent, published or acted on externally."
    : "State any irreversible or external action separately so the caller can review it.";
  return {
    name: agentName,
    title,
    description: `${values.company}'s lead Pollinations Agent for ${services}.`.slice(0, 1000),
    type: "prompt_agent",
    visibility: "private",
    systemPrompt: [
      `You are the lead Agent for ${values.company}, a one-person company founded by ${values.founder}.`,
      `Mission: ${values.mission}`,
      `Services: ${services}.`,
      template.instruction,
      "Return review-ready work with: Result; Evidence, assumptions and limits; Recommended next actions; Decision needed from the human.",
      "Do not invent customers, sources, metrics, credentials, completed outreach, publications or external actions. If evidence was not supplied, say what is missing.",
      humanGate,
    ].join("\n\n"),
    baseModel: DEFAULT_BASE_MODEL,
    mcpServers: [],
    requiredSafetyFeatures: ["privacy", "secrets"],
  };
}

function renderBlueprint() {
  const blueprint = buildBlueprint();
  els.agentBlueprint.textContent = JSON.stringify(blueprint, null, 2);
  return blueprint;
}

function nextFloorNumber() {
  return Math.max(...entities.map((entity) => entity.floor), 12) + 1;
}

function refreshDraftUi() {
  entities = buildEntities();
  renderSectorFilter();
  els.nextFloorBadge.textContent = draftFloor ? `Draft preview: F${draftFloor.floor}` : `Next: F${nextFloorNumber()}`;
  els.removeDraftButton.classList.toggle("hidden", !draftFloor);
}

function submitRent(event) {
  event.preventDefault();
  const values = rentFormValues();
  const blueprint = buildBlueprint(values);
  const template = RENT_TEMPLATES[values.template] || RENT_TEMPLATES.operator;
  const floor = draftFloor?.floor || nextFloorNumber();
  draftFloor = {
    id: `draft-${slugify(values.company)}`,
    kind: "draft",
    floor,
    name: values.company,
    founder: values.founder,
    sector: values.sector,
    color: values.color,
    mission: values.mission,
    services: values.services,
    crew: template.crew,
    agentName: blueprint.name,
    agentModel: null,
    baseModel: DEFAULT_BASE_MODEL,
    sampleTitle: "Draft floor status",
    sample: "This floor is previewing locally. Export the blueprint, create the Prompt Agent under the appropriate Pollinations account, then connect its published model ID before accepting commissions.",
    examples: {
      research: `Research the first evidence pack ${values.company} should prepare for a new client.`,
      outreach: `Draft honest outreach for ${values.company} without inventing customers or results.`,
      build: `Specify the smallest useful workflow or product ${values.company} should build first.`,
      report: `Create a weekly owner-report template for ${values.company}.`,
      custom: `Turn the mission of ${values.company} into a two-week operating plan.`,
    },
  };
  saveDraftFloor();
  refreshDraftUi();
  selectFloor(draftFloor.id, { forceExample: true });
  renderBlueprint();
  setStatus(els.rentStatus, `F${floor} is previewing in the tower. The floor is local until its Prompt Agent is provisioned from the blueprint.`, "success");
  document.getElementById("tower")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function removeDraft() {
  if (!draftFloor) return;
  const removedId = draftFloor.id;
  draftFloor = null;
  saveDraftFloor();
  refreshDraftUi();
  selectFloor(selectedId === removedId ? COMPANY_FLOORS[0].id : selectedId, { forceExample: true });
  setStatus(els.rentStatus, "Draft floor removed from this browser.", "success");
}

async function copyBlueprint() {
  const blueprint = renderBlueprint();
  try {
    await navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
    setStatus(els.rentStatus, "Agent blueprint copied.", "success");
  } catch {
    setStatus(els.rentStatus, "Clipboard access was blocked. Select the JSON and copy it manually.", "error");
  }
}

function downloadBlueprint() {
  const blueprint = renderBlueprint();
  const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${blueprint.name}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleFloorSelectionClick(event) {
  if (suppressNextFloorClick) {
    suppressNextFloorClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const trigger = event.target.closest("[data-select-floor]");
  if (trigger) selectFloor(trigger.dataset.selectFloor);
}

function setupTowerDrag() {
  let dragging = false;
  let startX = 0;
  let startAngle = -24;
  let moved = 0;

  const setAngle = (angle) => {
    const clamped = Math.max(-68, Math.min(18, angle));
    els.towerScene.style.setProperty("--building-angle", `${clamped}deg`);
    return clamped;
  };

  els.towerScene.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = event.clientX;
    startAngle = Number.parseFloat(getComputedStyle(els.towerScene).getPropertyValue("--building-angle")) || -24;
    els.towerScene.classList.add("dragging");
    els.towerScene.setPointerCapture?.(event.pointerId);
  });

  els.towerScene.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    moved = Math.max(moved, Math.abs(delta));
    setAngle(startAngle + delta * 0.16);
  });

  const stop = () => {
    if (!dragging) return;
    dragging = false;
    els.towerScene.classList.remove("dragging");
    if (moved > 8) suppressNextFloorClick = true;
  };
  els.towerScene.addEventListener("pointerup", stop);
  els.towerScene.addEventListener("pointercancel", stop);
  els.resetViewButton.addEventListener("click", () => setAngle(-24));
}

function bindEvents() {
  document.addEventListener("click", handleFloorSelectionClick);
  els.directorySearch.addEventListener("input", renderDirectory);
  els.sectorFilter.addEventListener("change", renderDirectory);
  els.floorPicker.addEventListener("change", () => selectFloor(els.floorPicker.value));
  els.dayNightButton.addEventListener("click", () => {
    const night = els.towerScene.classList.toggle("night");
    els.dayNightButton.setAttribute("aria-pressed", String(night));
    els.dayNightButton.textContent = night ? "Day view" : "Night lights";
  });
  els.connectButton.addEventListener("click", () => {
    startConnect().catch((error) => setStatus(els.jobStatus, error.message || "Could not start Pollinations sign-in.", "error"));
  });
  els.disconnectButton.addEventListener("click", () => {
    setApiKey("");
    setStatus(els.jobStatus, "Disconnected for this tab. You can also revoke the key in your Pollinations dashboard.", "success");
  });
  els.saveManualKeyButton.addEventListener("click", async () => {
    const key = els.manualApiKey.value.trim();
    if (!key) {
      setStatus(els.jobStatus, "Paste a Pollinations secret key first.", "error");
      return;
    }
    setApiKey(key);
    els.manualApiKey.value = "";
    setStatus(els.jobStatus, "Manual key saved for this tab only.", "success");
    await refreshUserInfo();
  });
  els.jobType.addEventListener("change", () => refreshExample(false));
  els.loadExampleButton.addEventListener("click", () => refreshExample(true));
  els.jobForm.addEventListener("submit", submitJob);
  els.jobBoard.addEventListener("click", handleJobAction);
  els.clearJobsButton.addEventListener("click", () => {
    jobs = jobs.filter((job) => !["approved", "failed"].includes(job.status));
    saveJobs();
    renderJobs();
  });
  for (const input of [els.rentCompany, els.rentFounder, els.rentSector, els.rentColor, els.rentMission, els.rentServices, els.rentTemplate, els.rentHumanGate]) {
    input.addEventListener("input", renderBlueprint);
    input.addEventListener("change", renderBlueprint);
  }
  els.rentForm.addEventListener("submit", submitRent);
  els.removeDraftButton.addEventListener("click", removeDraft);
  els.copyBlueprintButton.addEventListener("click", copyBlueprint);
  els.downloadBlueprintButton.addEventListener("click", downloadBlueprint);
}

async function init() {
  refreshDraftUi();
  bindEvents();
  setupTowerDrag();
  selectFloor(selectedId, { forceExample: true });
  renderJobs();
  renderBlueprint();
  updateConnectionUi();
  await handleAuthReturn();
  await refreshUserInfo();
}

init().catch((error) => {
  console.error(error);
  setStatus(els.jobStatus, "Atrium HQ hit a startup error. Reload the page; your local jobs were not intentionally changed.", "error");
});
