#!/usr/bin/env node

/**
 * Alloy Agent CLI - Interactive Chat
 * 
 * Simple interactive chat like pi.dev
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";
const STATE_FILE = join(process.env.HOME || "/home/zerwiz", ".alloy", "state.json");

interface AppState {
  model: string;
  theme: string;
  messages: {role: string, content: string}[];
}

function loadState(): AppState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {}
  return {
    model: DEFAULT_MODEL,
    theme: "nord",
    messages: [{ role: "system", content: "You are Alloy, a helpful AI coding assistant." }],
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

async function main() {
  // Check Ollama
  if (!await checkOllama()) {
    console.error(`Error: Ollama not running at ${OLLAMA_URL}`);
    process.exit(1);
  }
  
  const state = loadState();
  const currentModel = state.model;
  
  // Welcome
  console.clear();
  console.log(" ╔═══════════════════════════════════════════╗");
  console.log(" ║      Alloy Agent - Interactive CLI     ║");
  console.log(" ╠═══════════════════════════════════════════╣");
  console.log(" ║  Just talk to me. I'm here to help.   ║");
  console.log(" ║                                   ║");
  console.log(" ║  Commands:                        ║");
  console.log(" ║    /clear    - Clear conversation ║");
  console.log(" ║    /models  - List models        ║");
  console.log(" ║    /quit    - Exit             ║");
  console.log(" ╚═══════════════════════════════════════════╝");
  console.log("");
  
  // Interactive loop
  process.stdin.setEncoding("utf-8");
  
  const writePrompt = () => process.stdout.write("\n> ");
  
  writePrompt();
  
  for await (const line of process.stdin) {
    const cmd = line.trim();
    
    if (!cmd) {
      writePrompt();
      continue;
    }
    
    // Check for exit commands
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === "/quit" || lowerCmd === "/exit" || lowerCmd === "q" || lowerCmd === "quit" || lowerCmd === "exit") {
      console.log("\nGoodbye!");
      saveState(state);
      process.exit(0);
    }
    
    // Check for clear
    if (lowerCmd === "/clear" || lowerCmd === "c" || lowerCmd === "clear") {
      state.messages = [{ role: "system", content: "You are Alloy, a helpful AI coding assistant." }];
      console.clear();
      writePrompt();
      continue;
    }
    
    if (cmd === "/models") {
      try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`);
        const data = await res.json();
        console.log("\nAvailable models:");
        for (const m of data.models || []) {
          console.log("  -", m.name);
        }
      } catch (e) {
        console.log("Error:", e);
      }
      writePrompt();
      continue;
    }
    
    // Chat
    state.messages.push({ role: "user", content: cmd });
    
    process.stdout.write("\nAlloy: ");
    
    try {
      const response = await chat(currentModel, state.messages);
      console.log(response);
      state.messages.push({ role: "assistant", content: response });
    } catch (e: any) {
      console.log("Error:", e.message);
    }
    
    writePrompt();
  }
  
  process.exit(0);
}

main().catch(console.error);