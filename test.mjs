import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const js = await readFile(new URL("./app.js", import.meta.url), "utf8");
const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
const agents = JSON.parse(await readFile(new URL("./agents/agents.json", import.meta.url), "utf8"));
const readme = await readFile(new URL("./README.md", import.meta.url), "utf8");

const expectedHtmlIds = [
  "directorySearch",
  "sectorFilter",
  "directoryList",
  "towerScene",
  "building",
  "elevatorCar",
  "floorPicker",
  "officeDetail",
  "selectedAgentModel",
  "jobForm",
  "jobType",
  "jobPrompt",
  "runJobButton",
  "jobBoard",
  "rentForm",
  "agentBlueprint",
  "connectButton",
  "disconnectButton",
];

test("all JavaScript element contracts exist in the HTML", () => {
  for (const id of expectedHtmlIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
    assert.match(js, new RegExp(`\\$\\("${id}"\\)`), `app.js does not bind #${id}`);
  }
});

test("the tower has ten companies plus a concierge, all backed by Agent definitions", () => {
  const companyNames = [...js.matchAll(/agentName:\s*"([^"]+)"/g)].map((match) => match[1]);
  const uniqueCompanyNames = [...new Set(companyNames)];
  const definedNames = agents.agents.map((agent) => agent.name);
  assert.equal(uniqueCompanyNames.length, 11);
  assert.deepEqual(new Set(definedNames), new Set(uniqueCompanyNames));
  assert.equal(new Set(definedNames).size, definedNames.length);
  for (const agent of agents.agents) {
    assert.equal(agent.type, "prompt_agent");
    assert.equal(agent.visibility, "public");
    assert.ok(agent.title.length >= 1 && agent.title.length <= 42, agent.name);
    assert.ok(agent.systemPrompt.length > 200 && agent.systemPrompt.length <= 8000, agent.name);
    assert.match(agent.systemPrompt, /Decision needed from the human|Recommended floor/);
  }
});

test("BYOP uses PKCE/session storage and never persists a visitor key with jobs", () => {
  assert.match(js, /code_challenge_method:\s*"S256"/);
  assert.match(js, /sessionStorage\.setItem\(STORAGE\.apiKey/);
  assert.doesNotMatch(js, /localStorage\.setItem\(STORAGE\.apiKey/);
  assert.match(js, /localStorage\.setItem\(STORAGE\.jobs/);
  assert.match(js, /AGENT_NOT_PROVISIONED/);
  assert.match(js, /will not fake the run with a generic model/);
  assert.match(js, /reasoning_effort:\s*"none"/);
});

test("the interactive building, human gate and rent-a-floor flows are wired", () => {
  for (const needle of [
    "setupTowerDrag",
    "data-select-floor",
    "updateElevator",
    "submitJob",
    "Request revision",
    "Approve draft",
    "buildBlueprint",
    "submitRent",
    "downloadBlueprint",
  ]) {
    assert.ok(js.includes(needle), `missing ${needle}`);
  }
  assert.match(css, /preserve-3d/);
  assert.match(css, /rotateY\(90deg\)/);
  assert.match(html, /Apply to rent a floor/);
});

test("repository contains no secret-key material and carries Pollinations credit", () => {
  const all = `${html}\n${js}\n${css}\n${readme}\n${JSON.stringify(agents)}`;
  assert.doesNotMatch(all, /\bsk_[A-Za-z0-9_-]{16,}\b/);
  assert.doesNotMatch(all, /\b(?:github_pat|ghp)_[A-Za-z0-9_]{16,}\b/);
  assert.match(readme, /badge-made-with\.svg/);
  assert.match(html, /badge-made-with\.svg/);
});
