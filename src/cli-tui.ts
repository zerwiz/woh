#!/usr/bin/env node

/**
 * Alloy Agent CLI - Full-Featured Interactive Agent
 * 
 * Features from all Pi extensions:
 * - Interactive chat (from cli-tui)
 * - Agent chain (from agent-chain) - Sequential pipeline
 * - Agent team (from agent-team) - Parallel dispatch
 * - Subagent widget (from subagent-widget) - Background agents
 * - TillDone (from tilldone) - Task tracking
 * - Theme cycling (from theme-cycler)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";
const STATE_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "state.json");
const SUBAGENTS_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "subagents.json");
const TASKS_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "tasks.json");

// Available themes
const THEMES = {
  nord: { bg: "\x1b[48;2;46;52;64m", fg: "\x1b[38;2;216;222;233m", accent: "\x1b[38;2;136;192;208m", success: "\x1b[38;2;163;190;140m", reset: "\x1b[0m" },
  dracula: { bg: "\x1b[48;2;40;42;54m", fg: "\x1b[38;2;248;248;242m", accent: "\x1b[38;2;255;121;198m", success: "\x1b[38;2;80;250;123m", reset: "\x1b[0m" },
  catppuccin: { bg: "\x1b[48;2;30;30;46m", fg: "\x1b[38;2;205;214;244m", accent: "\x1b[38;2;137;180;250m", success: "\x1b[38;2;166;227;161m", reset: "\x1b[0m" },
  synthwave: { bg: "\x1b[48;2;36;31;45m", fg: "\x1b[38;2;244;222;225m", accent: "\x1b[38;2;249;126;114m", success: "\x1b[38;2;114;241;184m", reset: "\x1b[0m" },
  tokyo: { bg: "\x1b[48;2;26;27;38m", fg: "\x1b[38;2;192;202;245m", accent: "\x1b[38;2;122;162;247m", success: "\x1b[38;2;158;206;106m", reset: "\x1b[0m" },
};

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";

const TEAMS = {
  all: ["architect", "builder", "scanner", "tester"],
  development: ["architect", "builder", "scanner", "tester"],
  testing: ["scanner", "tester"],
  review: ["architect", "tester"],
  "code-review": ["scanner", "architect"],
  "pair-programming": ["builder", "scanner"],
};

const CHAINS = {
  "plan-build": ["planner", "builder"],
  "plan-build-review": ["planner", "builder", "reviewer"],
  "scout-flow": ["scout", "scout", "scout"],
  "full-review": ["scout", "planner", "builder", "reviewer"],
};

const SUBAGENTS = {
  analyst: "For deep analysis and research",
  debugger: "For finding and fixing bugs",  
  coder: "For writing new code",
  reviewer: "For code review",
  tester: "For running tests",
};

let theme = "nord";
let mode = "chat"; // chat, team, chain
let activeTeam = "all";
let activeChain = "plan-build-review";
let todoMode = false; // TillDone mode - require task before tools

// Subagent states (background processes)
const subagentStates: Record<string, {status: string, lastWork: string, task: string}> = {};

// Task list (TillDone)
const tasks: {id: number, text: string, done: boolean, created: number}[] = [];
let nextTaskId = 1;

function getSystemPrompt(): string {
  const agentsList = Object.keys(TEAMS).map(t => `- ${t}: ${TEAMS[t].join(", ")}`).join("\n");
  const chainsList = Object.keys(CHAINS).map(c => `- ${c}: ${CHAINS[c].join(" → ")}`).join("\n");
  const subagentList = Object.entries(SUBAGENTS).map(([name, desc]) => `- ${name}: ${desc}`).join("\n");
  const taskList = tasks.length > 0 ? tasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.text}`).join("\n") : "(no tasks)";
  
  return `You are Alloy, a full-featured AI coding assistant.

## Modes (use /mode to switch)
- chat   - Direct conversation
- team   - Dispatch to multiple agents in parallel
- chain  - Run agents sequentially (pipeline)

## Teams (${Object.keys(TEAMS).join(", ")})
${agentsList}

## Chains (${Object.keys(CHAINS).join(", ")})
${chainsList}

## Commands
- @agent task      - Dispatch to single agent  
- /team name      - Switch team mode
- /chain name     - Switch chain mode
- /theme name    - Switch theme (nord, dracula, catppuccin, synthwave, tokyo)
- /mode chat|team|chain - Switch mode
- /sub add task   - Spawn background subagent with task
- /sub list      - List background subagents
- /sub clear    - Clear all subagents
- /todo add task - Add task to tracking
- /todo list    - List tasks
- /todo done N   - Mark task N done
- /todo clear   - Clear done tasks

## Sub-Agents (background workers)
${subagentList}

## Task Tracking (TillDone)
${taskList}

Current theme: ${theme} | Mode: ${mode}`;
}

interface AppState {
  model: string;
  messages: {role: string, content: string}[];
}

function loadState(): AppState {
  try {
    if (existsSync(STATE_FILE)) {
      const s = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      if (!s.messages) s.messages = [{ role: "system", content: getSystemPrompt() }];
      return s;
    }
  } catch {}
  return {
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: getSystemPrompt() }],
  };
}

function saveState(state: AppState): void {
  const dir = join(STATE_FILE, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function chat(model: string, messages: {role: string, content: string}[]): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const data = await response.json();
  return data.message?.content || "No response";
}

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch { return false; }
}

function getThemeColors() {
  return THEMES[theme as keyof typeof THEMES] || THEMES.nord;
}

function showHeader() {
  const t = getThemeColors();
  console.clear();
  console.log(` ${t.accent}╔${"═".repeat(46)}╗${RESET}`);
  console.log(` ${t.accent}║${t.fg}      Alloy Agent - Interactive CLI       ${t.accent}║${RESET}`);
  console.log(` ${t.accent}║${t.fg}  Teams: ${t.success}${Object.keys(TEAMS).slice(0,4).join(", ")}${GRAY}       ${t.accent}║${RESET}`);
  console.log(` ${t.accent}║${t.fg}  Theme: ${t.success}${theme}${GRAY} | Mode: ${t.success}${mode}${GRAY}                  ${t.accent}║${RESET}`);
  console.log(` ${t.accent}╚${"═".repeat(46)}╝${RESET}`);
  console.log("");
}

function showPrompt() {
  const t = getThemeColors();
  process.stdout.write(` ${t.accent}>${t.fg} `);
}

async function main() {
  const ok = await checkOllama();
  if (!ok) {
    console.error(`Error: Ollama not running at ${OLLAMA_URL}`);
    process.exit(1);
  }
  
  const state = loadState();
  const currentModel = state.model;
  
  showHeader();
  console.log(` ${getThemeColors().accent}Commands: quit, clear, models, /team, /chain, /theme${getThemeColors().fg}`);
  console.log("");
  
  showPrompt();
  
  process.stdin.setEncoding("utf-8");
  
  let buffer = "";
  
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    
    while (buffer.includes("\n")) {
      const line = buffer.split("\n")[0];
      buffer = buffer.slice(buffer.indexOf("\n") + 1);
      
      const cmd = line.trim();
      const lower = cmd.toLowerCase();
      
      // Exit - check before anything else
      if (lower === "quit" || lower === "q" || lower === "exit") {
        console.log("\nGoodbye!");
        saveState(state);
        process.exit(0);
        return;
      }
      
      // Clear
      if (lower === "clear" || lower === "c") {
        state.messages = [{ role: "system", content: getSystemPrompt() }];
        theme = "nord";
        mode = "chat";
        showHeader();
        console.log(` ${t.accent}Commands: quit, clear, models, /team, /chain, /theme${RESET}`);
        showPrompt();
        continue;
      }
      
      // Models
      if (lower === "models") {
        try {
          const res = await fetch(`${OLLAMA_URL}/api/tags`);
          const data = await res.json();
          const t = getThemeColors();
          console.log(`\n ${t.accent}Available models:${RESET}`);
          for (const m of data.models || []) console.log(`  - ${m.name}`);
        } catch (e) { console.log("Error:", e); }
        showPrompt();
        continue;
      }
      
      // ==================== Subagent Commands ====================
      
      // /sub list - List subagents
      if (lower === "/sub list" || lower === "/sub") {
        const t = getThemeColors();
        console.log(`\n ${t.accent}Sub-agents:${RESET}`);
        if (Object.keys(subagentStates).length === 0) {
          console.log("  (none)");
        } else {
          for (const [name, s] of Object.entries(subagentStates)) {
            console.log(`  - ${name}: ${s.status} - ${s.task}`);
          }
        }
        showPrompt();
        continue;
      }
      
      // /sub clear - Clear subagents
      if (lower === "/sub clear") {
        const t = getThemeColors();
        console.log(`\n ${t.accent}Cleared all sub-agents${RESET}`);
        Object.keys(subagentStates).forEach(k => delete subagentStates[k]);
        showPrompt();
        continue;
      }
      
      // /sub add task - Start background subagent
      if (cmd.startsWith("/sub add ") || (cmd.startsWith("/sub ") && !lower.startsWith("/sub list") && !lower.startsWith("/sub clear"))) {
        const taskText = cmd.replace(/^\/sub\s+(add\s+)?/, "").trim();
        if (taskText) {
          const subagentName = "sub" + Object.keys(subagentStates).length;
          subagentStates[subagentName] = {
            status: "running",
            task: taskText,
            lastWork: "Processing..."
          };
          const t = getThemeColors();
          console.log(`\n ${t.accent}Started subagent: ${subagentName}${RESET}`);
          console.log(`  Task: ${taskText}`);
        } else {
          console.log(`\n Usage: /sub add <task description>`);
        }
        showPrompt();
        continue;
      }
      
      // ==================== Todo Commands ====================
      
      // /todo add task
      if (cmd.startsWith("/todo add ") || lower === "/todo add" || cmd === "/todo") {
        const taskText = cmd.replace(/^\/todo\s+add\s+/, "").trim() || cmd.replace(/^\/todo\s+/, "").trim();
        if (taskText && taskText !== "todo") {
          tasks.push({ id: nextTaskId++, text: taskText, done: false, created: Date.now() });
          const t = getThemeColors();
          console.log(`\n ${t.success}Added task #${nextTaskId - 1}: ${taskText}${RESET}`);
        } else {
          console.log(`\n Usage: /todo add <task description>`);
        }
        showPrompt();
        continue;
      }
      
      // /todo list
      if (lower === "/todo list") {
        const t = getThemeColors();
        console.log(`\n ${t.accent}Tasks:${RESET}`);
        if (tasks.length === 0) {
          console.log("  (none)");
        } else {
          for (const task of tasks) {
            console.log(`  [${task.done ? t.success + "✓" : " "}] #${task.id}: ${task.text}`);
          }
        }
        showPrompt();
        continue;
      }
      
      // /todo done N
      if (lower.startsWith("/todo done ")) {
        const taskId = parseInt(lower.replace("/todo done ", "").trim());
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.done = true;
          const t = getThemeColors();
          console.log(`\n ${t.success}Task #${taskId} marked done${RESET}`);
        } else {
          console.log(`\n Task #${taskId} not found`);
        }
        showPrompt();
        continue;
      }
      
      // /todo clear
      if (lower === "/todo clear") {
        const undone = tasks.filter(t => !t.done);
        undone.forEach(t => { t.done = false; });
        const t = getThemeColors();
        console.log(`\n ${t.success}Cleared done tasks${RESET}`);
        showPrompt();
        continue;
      }
      
      // Theme switch
      if (lower.startsWith("/theme ")) {
        const newTheme = lower.replace("/theme ", "").trim();
        if (THEMES[newTheme as keyof typeof THEMES]) {
          theme = newTheme;
          state.messages = [{ role: "system", content: getSystemPrompt() }];
          const t = getThemeColors();
          console.log(`\n ${t.success}Theme set to: ${newTheme}${RESET}`);
        } else {
          console.log(`\n Available themes: ${Object.keys(THEMES).join(", ")}`);
        }
        showPrompt();
        continue;
      }
      
      // Team switch
      if (lower.startsWith("/team ")) {
        const newTeam = lower.replace("/team ", "").trim();
        if (TEAMS[newTeam as keyof typeof TEAMS]) {
          activeTeam = newTeam;
          mode = "team";
          const t = getThemeColors();
          console.log(`\n ${t.success}Team set to: ${newTeam} (${TEAMS[newTeam as keyof typeof TEAMS].join(", ")})${RESET}`);
        } else {
          console.log(`\n Available teams: ${Object.keys(TEAMS).join(", ")}`);
        }
        showPrompt();
        continue;
      }
      
      // Chain switch
      if (lower.startsWith("/chain ")) {
        const newChain = lower.replace("/chain ", "").trim();
        if (CHAINS[newChain as keyof typeof CHAINS]) {
          activeChain = newChain;
          mode = "chain";
          const t = getThemeColors();
          console.log(`\n ${t.success}Chain set to: ${newChain} (${CHAINS[newChain as keyof typeof CHAINS].join(" → ")})${RESET}`);
        } else {
          console.log(`\n Available chains: ${Object.keys(CHAINS).join(", ")}`);
        }
        showPrompt();
        continue;
      }
      
      // Mode switch
      if (lower.startsWith("/mode ")) {
        const newMode = lower.replace("/mode ", "").trim();
        if (newMode === "chat" || newMode === "team" || newMode === "chain") {
          mode = newMode;
          const t = getThemeColors();
          console.log(`\n ${t.success}Mode set to: ${newMode}${RESET}`);
        }
        showPrompt();
        continue;
      }
      
      if (!cmd) {
        showPrompt();
        continue;
      }
      
      // Check for @agent dispatch
      if (cmd.startsWith("@")) {
        const agentMatch = cmd.match(/^@(\w+)\s+(.+)$/);
        if (agentMatch) {
          const [, agent, task] = agentMatch;
          const t = getThemeColors();
          console.log(`\n ${t.accent}Dispatching to @${agent}...${RESET}`);
          state.messages.push({ role: "user", content: `[Dispatch to ${agent}]: ${task}` });
          process.stdout.write(`\n ${t.accent}Alloy:${t.fg} `);
          try {
            const response = await chat(currentModel, state.messages);
            console.log(response);
            state.messages.push({ role: "assistant", content: response });
          } catch (e: any) {
            console.log("Error:", e.message);
          }
          showPrompt();
          continue;
        }
      }
      
      // Team mode - dispatch to team
      if (mode === "team" && TEAMS[activeTeam as keyof typeof TEAMS]) {
        const t = getThemeColors();
        console.log(`\n ${t.accent}Running team: ${activeTeam}${RESET}`);
        for (const agent of TEAMS[activeTeam as keyof typeof TEAMS]) {
          console.log(` ${t.accent}→ @${agent}: ${cmd}${RESET}`);
          state.messages.push({ role: "user", content: `[Team ${activeTeam} - ${agent}]: ${cmd}` });
          try {
            const response = await chat(currentModel, state.messages);
            console.log(`  ${t.success}${response.slice(0, 200)}${RESET}`);
            state.messages.push({ role: "assistant", content: `[${agent}]: ${response}` });
          } catch (e: any) {
            console.log(`  Error: ${e.message}`);
          }
        }
        showPrompt();
        continue;
      }
      
// Chain mode - run sequentially
      if (mode === "chain" && CHAINS[activeChain as keyof typeof CHAINS]) {
        const t = getThemeColors();
        console.log(`\n ${t.accent}Running chain: ${activeChain}${RESET}`);
        for (const agent of CHAINS[activeChain as keyof typeof CHAINS]) {
          console.log(` ${t.accent}→ @${agent}: ${cmd}${RESET}`);
          state.messages.push({ role: "user", content: `[Chain ${activeChain} - ${agent}]: ${cmd}` });
          try {
            const response = await chat(currentModel, state.messages);
            console.log(`  ${t.success}${response.slice(0, 200)}${RESET}`);
            state.messages.push({ role: "assistant", content: `[${agent}]: ${response}` });
          } catch (e: any) {
            console.log(`  Error: ${e.message}`);
          }
        }
        showPrompt();
        continue;
      }
      
      // Normal chat
      state.messages.push({ role: "user", content: cmd });
      const t = getThemeColors();
      process.stdout.write(`\n ${t.accent}Alloy:${t.fg} `);
      
      try {
        const response = await chat(currentModel, state.messages);
        console.log(response);
        state.messages.push({ role: "assistant", content: response });
      } catch (e: any) {
        console.log("Error:", e.message);
      }
      
      showPrompt();
    }
  });
  
  process.stdin.on("end", () => {
    saveState(state);
  });
}

main();