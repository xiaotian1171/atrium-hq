#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "agents/agents.json");
const lockPath = resolve(root, "agents/agents.lock.json");
const API = "https://gen.pollinations.ai/account/agents";
const shouldCreate = process.argv.includes("--create");
const shouldUpdate = process.argv.includes("--update");
const apiKey = process.env.POLLINATIONS_KEY || process.env.POLLINATIONS_API_KEY || "";

if (!apiKey) {
  console.error("Set POLLINATIONS_KEY in the environment first. The key is never read from this repository.");
  process.exit(2);
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const definitions = Array.isArray(config.agents) ? config.agents : [];
if (!definitions.length) throw new Error("agents/agents.json contains no agents.");

async function api(path = "", options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  if (!response.ok) {
    const message = data?.error?.message || data?.error || data?.message || text.slice(0, 300);
    throw new Error(`${options.method || "GET"} ${path || "/"} failed (${response.status}): ${typeof message === "string" ? message : JSON.stringify(message)}`);
  }
  return data;
}

function unwrapAgent(payload) {
  if (Array.isArray(payload)) return payload[0] || {};
  return payload?.agent || payload?.data || payload || {};
}

function publicRecord(agent, definition) {
  return {
    id: agent.id || null,
    modelId: agent.modelId || `community/${config.owner}/${definition.name}`,
    name: agent.name || definition.name,
    title: agent.title || definition.title,
    type: agent.type || definition.type,
    visibility: agent.visibility || definition.visibility,
  };
}

const listed = await api("");
const existingAgents = Array.isArray(listed?.data) ? listed.data : Array.isArray(listed) ? listed : [];
const byName = new Map(existingAgents.filter((agent) => agent?.name).map((agent) => [agent.name, agent]));
const records = [];

console.log(`Found ${existingAgents.length} existing Agent(s) on the authenticated account.`);
console.log(shouldCreate ? "Mode: create missing Atrium HQ Agents." : "Mode: dry run. Re-run with --create to create missing Agents.");

for (const definition of definitions) {
  const existing = byName.get(definition.name);
  if (existing && !shouldUpdate) {
    console.log(`EXISTS ${definition.name} -> ${existing.modelId || existing.id}`);
    records.push(publicRecord(existing, definition));
    continue;
  }

  if (!shouldCreate && !existing) {
    console.log(`MISSING ${definition.name}`);
    records.push(publicRecord({}, definition));
    continue;
  }

  if (existing && shouldUpdate) {
    if (!existing.id) throw new Error(`Existing Agent ${definition.name} has no id, so it cannot be updated safely.`);
    console.log(`UPDATE ${definition.name}`);
    const updated = unwrapAgent(await api(`/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(definition),
    }));
    records.push(publicRecord({ ...existing, ...updated }, definition));
    continue;
  }

  console.log(`CREATE ${definition.name}`);
  const created = unwrapAgent(await api("", {
    method: "POST",
    body: JSON.stringify(definition),
  }));
  records.push(publicRecord(created, definition));
}

if (shouldCreate) {
  await writeFile(lockPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), agents: records }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${lockPath}`);
}
