#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";

export type ExecutionMode = "single" | "team" | "chain" | "parallel";

export interface TeamConfig {
  name: string;
  agents: string[];
}

export interface ChainConfig {
  name: string;
  steps: string[];
}

const TEAMS_FILE = "/home/zerwiz/woh/alloy_agent/agents/teams.yaml";
const CHAIN_FILE = "/home/zerwiz/woh/alloy_agent/agents/agent-chain.yaml";

export function loadTeams(): TeamConfig[] {
  try {
    const content = readFileSync(TEAMS_FILE, "utf-8");
    const teams: TeamConfig[] = [];
    let current: TeamConfig | null = null;
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      if (!trimmed.startsWith(" ") && !trimmed.startsWith("\t") && trimmed.endsWith(":")) {
        const name = trimmed.replace(":", "");
        if (name !== "all" && name !== "development" && name !== "testing" && 
            name !== "review" && name !== "code-review" && name !== "pair-programming") {
          current = { name, agents: [] };
          teams.push(current);
        }
      } else if (current && trimmed.startsWith("-")) {
        current.agents.push(trimmed.replace("-", "").trim());
      }
    }
    
    return [
      { name: "all", agents: ["architect", "builder", "scanner", "tester"] },
      { name: "development", agents: ["architect", "builder", "scanner", "tester"] },
      { name: "testing", agents: ["scanner", "tester"] },
      { name: "review", agents: ["architect", "tester"] },
      { name: "code-review", agents: ["scanner", "architect"] },
      { name: "pair-programming", agents: ["builder", "scanner"] },
      ...teams,
    ];
  } catch {
    return [
      { name: "all", agents: ["architect", "builder", "scanner", "tester"] },
    ];
  }
}

export function loadChains(): ChainConfig[] {
  try {
    const content = readFileSync(CHAIN_FILE, "utf-8");
    const chains: ChainConfig[] = [];
    let current: ChainConfig | null = null;
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      if (!trimmed.startsWith(" ") && !trimmed.startsWith("\t") && trimmed.endsWith(":")) {
        current = { name: trimmed.replace(":", ""), steps: [] };
        chains.push(current);
      } else if (current && trimmed.startsWith("-")) {
        current.steps.push(trimmed.replace("-", "").trim());
      }
    }
    
    return chains;
  } catch {
    return [];
  }
}

export function getMode(): ExecutionMode {
  const arg = process.argv[2];
  if (arg === "--team") return "team";
  if (arg === "--chain") return "chain";
  if (arg === "--parallel") return "parallel";
  return "single";
}

export async function executeTeam(task: string, teamName: string): Promise<void> {
  const teams = loadTeams();
  const team = teams.find(t => t.name === teamName);
  if (!team) {
    console.log(`Team not found: ${teamName}`);
    console.log("Available teams:", teams.map(t => t.name).join(", "));
    return;
  }
  
  console.log(`Executing team: ${teamName}`);
  console.log(`Agents: ${team.agents.join(", ")}`);
  console.log(`Task: ${task}`);
}

export async function executeChain(task: string, chainName: string): Promise<void> {
  const chains = loadChains();
  const chain = chains.find(c => c.name === chainName);
  if (!chain) {
    console.log(`Chain not found: ${chainName}`);
    console.log("Available chains:", chains.map(c => c.name).join(", "));
    return;
  }
  
  console.log(`Executing chain: ${chainName}`);
  console.log(`Steps: ${chain.steps.join(" -> ")}`);
  console.log(`Task: ${task}`);
}

if (import.meta.url === process.argv[1] || process.argv[1]?.includes("modes.ts")) {
  const teams = loadTeams();
  console.log("Teams:");
  for (const team of teams) {
    console.log(`  ${team.name}: ${team.agents.join(", ")}`);
  }
  
  const chains = loadChains();
  console.log("\nChains:");
  for (const chain of chains) {
    console.log(`  ${chain.name}: ${chain.steps.join(" -> ")}`);
  }
}