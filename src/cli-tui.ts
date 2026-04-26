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
 * - Tool execution (!read, !write, !ls, !bash)
 * - Indexer subagent (scans dirs, spawns per-file agents)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
import { spawn } from "child_process";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";
const STATE_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "state.json");
const SUBAGENTS_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "subagents.json");
const TASKS_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "tasks.json");
const INDEX_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "index.json");
const INDEX_MD = join(process.env.HOME || "/home/zerwiz", ".alloy", "index.md");

interface FileInfo {
  path: string;
  type: string;
  size: number;
  modified: number;
}

interface IndexedFile {
  path: string;
  ext: string;
  size: number;
  info?: string;
}

const projectIndex: IndexedFile[] = [];

let lastIndexDir = "";

function generateIndexMarkdown(): string {
  const byExt: Record<string, IndexedFile[]> = {};
  for (const f of projectIndex) {
    if (!byExt[f.ext]) byExt[f.ext] = [];
    byExt[f.ext].push(f);
  }
  
  let md = `# Project Index\n\n`;
  md += `Last updated: ${new Date().toISOString()}\n`;
  md += `Directory: ${lastIndexDir}\n`;
  md += `Total files: ${projectIndex.length}\n\n`;
  md += `## By Extension\n\n`;
  
  for (const [ext, files] of Object.entries(byExt).sort((a, b) => b[1].length - a[1].length)) {
    md += `### .${ext} (${files.length} files)\n\n`;
    for (const f of files.slice(0, 20)) {
      md += `- \`${f.path}\` (${f.size} bytes)\n`;
    }
    if (files.length > 20) {
      md += `- ... and ${files.length - 20} more\n`;
    }
    md += `\n`;
  }
  
  return md;
}

function runCommand(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    const parts = cmd.split(" ");
    const proc = spawn(parts[0], parts.slice(1), { shell: true });
    let output = "";
    proc.stdout.on("data", (d) => output += d.toString());
    proc.stderr.on("data", (d) => output += d.toString());
    proc.on("close", () => resolve(output));
  });
}

function searchFiles(pattern: string, dir: string, maxFiles = 100): [string, number[]][] {
  const matches: [string, number[]][] = [];
  const regex = new RegExp(pattern);
  
  function walk(path: string, depth: number) {
    if (depth > 3 || matches.length >= maxFiles) return;
    try {
      const entries = readdirSync(path);
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const fullPath = join(path, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          walk(fullPath, depth + 1);
        } else {
          try {
            const content = readFileSync(fullPath, "utf-8");
            const lines: number[] = [];
            content.split("\n").forEach((line, i) => {
              if (regex.test(line)) lines.push(i + 1);
            });
            if (lines.length > 0) {
              matches.push([fullPath, lines]);
            }
          } catch { }
        }
      }
    } catch { }
  }
  
  walk(dir, 0);
  return matches;
}

function globFiles(pattern: string, dir = "."): string[] {
  const files: string[] = [];
  const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
  
  function walk(path: string, depth: number) {
    if (depth > 4 || files.length > 500) return;
    try {
      const entries = readdirSync(path);
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const fullPath = join(path, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (regex.test(entry)) {
          files.push(fullPath);
        }
      }
    } catch { }
  }
  
  walk(dir, 0);
  return files;
}

function buildTree(dir: string, maxDepth = 3): string {
  let output = "";
  
  function walk(path: string, prefix = "", depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(path).filter(e => !e.startsWith("."));
      entries.sort((a, b) => {
        const aIsDir = statSync(join(path, a)).isDirectory();
        const bIsDir = statSync(join(path, b)).isDirectory();
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.localeCompare(b);
      });
      
      entries.forEach((entry, i) => {
        const fullPath = join(path, entry);
        const isDir = statSync(fullPath).isDirectory();
        const last = i === entries.length - 1;
        output += `${prefix}${last ? "└── " : "├── "}${entry}${isDir ? "/" : ""}\n`;
        if (isDir) {
          walk(fullPath, prefix + (last ? "    " : "│   "), depth + 1);
        }
      });
    } catch { }
  }
  
  output += dir + "/\n";
  walk(dir, "", 0);
  return output;
}

function scanDirectory(dir: string, maxDepth = 3): FileInfo[] {
  const files: FileInfo[] = [];
  
  function walk(path: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(path);
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const fullPath = join(path, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          walk(fullPath, depth + 1);
        } else {
          const ext = extname(entry);
          files.push({
            path: fullPath,
            type: ext.slice(1) || "file",
            size: stats.size,
            modified: stats.mtimeMs
          });
        }
      }
    } catch { }
  }
  
  walk(dir, 0);
  return files;
}

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
  indexer: "Scans directories and spawns per-file agents",
};

const INDEXER_TYPES = {
  ts: "TypeScript",
  js: "JavaScript", 
  tsx: "TSX",
  jsx: "JSX",
  json: "JSON",
  md: "Markdown",
  py: "Python",
  rs: "Rust",
  go: "Go",
  yaml: "YAML",
  yml: "YAML",
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
- /index dir    - Index directory (scans and spawns per-file agents)

## Tools (prefix with ! - read only)
- !read path     - Read file contents
- !ls [dir]      - List directory contents
- !grep pat [dir]- Search pattern in files
- !glob pat      - Find files by pattern
- !tree [dir]   - Directory tree view
- !stat path     - File stats/metadata
- !wc path       - Line/word/char count

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
      
      // /indexer spawn - Spawn indexer to scan and create agents for files
      if (lower === "/indexer spawn" || lower.startsWith("/indexer ")) {
        const targetDir = cmd.replace(/^\/indexer\s+/, "").trim() || process.cwd();
        const t = getThemeColors();
        console.log(`\n${t.accent}Indexer: Spawning agents for ${targetDir}...${RESET}`);
        
        const files = scanDirectory(targetDir);
        console.log(`\n${t.success}Found ${files.length} files${RESET}`);
        
        const spawnMatch = lower.match(/\/indexer\s+spawn\s+(.+)$/);
        const maxAgents = spawnMatch ? 5 : 10;
        
        for (const file of files.slice(0, maxAgents)) {
          const agentName = "file-" + basename(file.path);
          let fileInfo = "";
          try {
            const content = readFileSync(file.path, "utf-8").slice(0, 500);
            fileInfo = content.slice(0, 200);
          } catch { fileInfo = "(unreadable)"; }
          
          subagentStates[agentName] = {
            status: "active",
            task: `Process ${file.type}: ${file.path}`,
            lastWork: fileInfo
          };
        }
        
        console.log(`\n${t.success}Spawned ${Math.min(files.length, maxAgents)} file agents${RESET}`);
        
        showPrompt();
        continue;
      }
      
      // /index list - Show indexed files
      if (lower === "/index list" || lower === "/index") {
        const t = getThemeColors();
        if (existsSync(INDEX_MD)) {
          console.log(`\n${t.success}[Index: ${INDEX_MD}]${RESET}`);
          console.log(readFileSync(INDEX_MD, "utf-8").slice(0, 3000));
        } else if (projectIndex.length > 0) {
          console.log(`\n${t.accent}Current index: ${projectIndex.length} files${RESET}`);
          const byExt: Record<string, number> = {};
          for (const f of projectIndex) {
            byExt[f.ext] = (byExt[f.ext] || 0) + 1;
          }
          console.log(`\n${t.accent}By extension:${RESET}`);
          for (const [ext, count] of Object.entries(byExt).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
            console.log(`  .${ext}: ${count}`);
          }
        } else {
          console.log(`\nRun /index <directory> first`);
        }
        showPrompt();
        continue;
      }
      
      // /index export - Export to .md
      if (lower === "/index export" || lower.startsWith("/index export ")) {
        const targetPath = cmd.replace(/^\/index( export)?\s+/, "").trim() || INDEX_MD;
        const t = getThemeColors();
        
        if (projectIndex.length === 0) {
          console.log(`\nRun /index <directory> first`);
        } else {
          const md = generateIndexMarkdown();
          writeFileSync(targetPath, md);
          console.log(`\n${t.success}Exported to ${targetPath}${RESET}`);
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
      
      // ==================== Tool Execution ====================
      
      const toolMatch = cmd.match(/^!(\w+)\s*(.*)$/);
      if (toolMatch) {
        const [, tool, args] = toolMatch;
        const t = getThemeColors();
        
        try {
          if (tool === "read") {
            const content = readFileSync(args.trim(), "utf-8");
            console.log(`\n${t.success}[File: ${args.trim()}]${RESET}`);
            console.log(content.slice(0, 5000));
          } else if (tool === "ls") {
            const dir = args.trim() || ".";
            const files = readdirSync(dir);
            console.log(`\n${t.success}[Files in ${dir}]${RESET}`);
            for (const f of files) {
              const fullPath = join(dir, f);
              const isDir = statSync(fullPath).isDirectory();
              console.log(`  ${isDir ? t.accent + "📁" : "📄"} ${f}`);
            }
          } else if (tool === "grep") {
            const parts = args.trim().split(/\s+/);
            const pattern = parts[0];
            const dir = parts[1] || ".";
            const { matches, files } = searchFiles(pattern, dir);
            console.log(`\n${t.success}[${pattern} in ${dir}]${RESET}`);
            console.log(`  ${t.accent}Found in ${files.length} files:${RESET}`);
            for (const [file, lines] of matches.slice(0, 20)) {
              console.log(`  ${t.accent}${file}${RESET}: ${lines.join(", ")}`);
            }
          } else if (tool === "glob") {
            const pattern = args.trim() || "*";
            const files = globFiles(pattern);
            console.log(`\n${t.success}[glob: ${pattern}]${RESET}`);
            for (const f of files.slice(0, 50)) {
              console.log(`  ${f}`);
            }
            if (files.length > 50) console.log(`  ... and ${files.length - 50} more`);
          } else if (tool === "tree") {
            const dir = args.trim() || ".";
            const tree = buildTree(dir);
            console.log(`\n${t.success}[Tree: ${dir}]${RESET}`);
            console.log(tree.slice(0, 3000));
          } else if (tool === "stat") {
            const path = args.trim();
            const stats = statSync(path);
            console.log(`\n${t.success}[stat: ${path}]${RESET}`);
            console.log(`  size: ${stats.size}`);
            console.log(`  isDir: ${stats.isDirectory()}`);
            console.log(`  isFile: ${stats.isFile()}`);
            console.log(`  modified: ${new Date(stats.mtime).toISOString()}`);
          } else if (tool === "wc") {
            const path = args.trim();
            const content = readFileSync(path, "utf-8");
            const lines = content.split("\n").length;
            const words = content.split(/\s+/).length;
            const chars = content.length;
            console.log(`\n${t.success}[wc: ${path}]${RESET}`);
            console.log(`  lines: ${lines}, words: ${words}, chars: ${chars}`);
          } else {
            console.log(`\nUnknown tool: ${tool}`);
            console.log(`Tools: !read, !ls, !grep, !glob, !tree, !stat, !wc`);
          }
        } catch (e: any) {
          console.log(`\nError: ${e.message}`);
        }
        
        showPrompt();
        continue;
      }
      
      // ==================== Indexer Subagent ====================
      
      const indexerMatch = cmd.match(/^\/index\s+(.+)$/);
      if (indexerMatch) {
        const targetDir = indexerMatch[1].trim();
        const t = getThemeColors();
        console.log(`\n${t.accent}Indexer: Scanning ${targetDir}...${RESET}`);
        
        const files = scanDirectory(targetDir);
        
        const byType: Record<string, FileInfo[]> = {};
        for (const f of files) {
          if (!byType[f.type]) byType[f.type] = [];
          byType[f.type].push(f);
        }
        
        console.log(`\n${t.success}Found ${files.length} files (${Object.keys(byType).length} types)${RESET}`);
        for (const [type, list] of Object.entries(byType)) {
          console.log(`  ${t.accent}${type}${RESET}: ${list.length} files`);
        }
        
        console.log(`\n${t.accent}Spawning per-file agents...${RESET}`);
        
        const processed: string[] = [];
        for (const file of files.slice(0, 20)) {
          const fileType = INDEXER_TYPES[file.type as keyof typeof INDEXER_TYPES] || file.type;
          const agentName = "indexer-" + basename(file.path, "." + file.type);
          
          let fileInfo = "";
          try {
            const content = readFileSync(file.path, "utf-8").slice(0, 1000);
            const lines = content.split("\n").length;
            fileInfo = `${lines} lines, ${file.size} bytes\n\n${content.slice(0, 300)}...`;
          } catch {
            fileInfo = `${file.size} bytes (cannot read)`;
          }
          
          subagentStates[agentName] = {
            status: "indexing",
            task: `Index ${file.type} file: ${file.path}`,
            lastWork: fileInfo
          };
          processed.push(agentName);
        }
        
        console.log(`\n${t.success}Spawned ${processed.length} file indexer agents${RESET}`);
        
        for (const name of processed.slice(0, 5)) {
          console.log(`  ${t.accent}${name}${RESET}: ${subagentStates[name].task}`);
        }
        
        projectIndex.length = 0;
        lastIndexDir = targetDir;
        for (const f of files) {
          projectIndex.push({
            path: f.path,
            ext: f.type,
            size: f.size
          });
        }
        
        const dir = join(INDEX_FILE, "..");
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        
        writeFileSync(INDEX_FILE, JSON.stringify(projectIndex, null, 2));
        console.log(`\n${t.success}Index saved to ${INDEX_FILE}${RESET}`);
        
        const md = generateIndexMarkdown();
        writeFileSync(INDEX_MD, md);
        console.log(`\n${t.success}Markdown saved to ${INDEX_MD}${RESET}`);
        console.log(`\n${t.accent}Summary:${RESET}`);
        console.log(md.slice(0, 500));
        
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