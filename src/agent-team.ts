#!/usr/bin/env node

/**
 * Alloy Agent - Team Mode UI
 * 
 * Parallel agent dispatch - all agents work together
 */

import { readFileSync } from "fs";
import { join } from "path";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";
const STATE_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "state.json");

const TEAMS = {
  all: ["architect", "builder", "scanner", "tester"],
  development: ["architect", "builder", "scanner", "tester"],
  testing: ["scanner", "tester"],
  review: ["architect", "tester"],
  "code-review": ["scanner", "architect"],
  "pair-programming": ["builder", "scanner"],
};

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";
const ACCENT = "\x1b[38;2;136;192;208m";
const SUCCESS = "\x1b[38;2;163;190;140m";

let teamName = "all";
let task = "Team task"; // Default task
let agentResults: Record<string, string> = {};

async function chat(model: string, messages: {role: string, content: string}[]): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const data = await response.json();
  return data.message?.content || "No response";
}

async function runTeamMode() {
  const team = TEAMS[teamName as keyof typeof TEAMS] || TEAMS.all;
  
  console.clear();
  console.log(` ${ACCENT}╔${"═".repeat(50)}╗${RESET}`);
  console.log(` ${ACCENT}║${GRAY}        Alloy Agent - Team Mode           ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Team: ${SUCCESS}${teamName}${GRAY}                              ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Agents: ${team.join(", ")}${GRAY}                  ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}╚${"═".repeat(50)}╝${RESET}`);
  console.log("");
  console.log(` ${GRAY}Task: ${task}${RESET}`);
  console.log("");
  
  // Dispatch to each agent in parallel
  for (const agent of team) {
    console.log(` ${ACCENT}→ @${agent}: processing...${RESET}`);
    
    try {
      const response = await chat(DEFAULT_MODEL, [
        { role: "system", content: `You are the ${agent} agent. Respond as this specialist.` },
        { role: "user", content: task }
      ]);
      agentResults[agent] = response.slice(0, 300);
      console.log(`   ${SUCCESS}✓ ${agent}: ${response.slice(0, 100)}...${RESET}`);
    } catch (e: any) {
      console.log(`   ✗ ${agent}: ${e.message}`);
    }
  }
  
  console.log("");
  console.log(` ${ACCENT}═══════════════════════════════════════════════${RESET}`);
  console.log(` ${ACCENT}Team Results:${RESET}`);
  console.log("");
  for (const [agent, result] of Object.entries(agentResults)) {
    console.log(` ${ACCENT}@${agent}:${RESET}`);
    console.log(`   ${result}`);
    console.log("");
  }
}

async function main() {
  task = process.argv.slice(2).join(" ") || "Analyze the codebase";
  teamName = process.argv[2] || "all";
  
  if (!TEAMS[teamName as keyof typeof TEAMS]) {
    console.log(`Invalid team: ${teamName}`);
    console.log(`Available: ${Object.keys(TEAMS).join(", ")}`);
    process.exit(1);
  }
  
  await runTeamMode();
}

main();