#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export interface MemoryEntry {
  id: string;
  timestamp: number;
  type: "task" | "result" | "agent" | "tool" | "error";
  content: string;
  agent?: string;
  tool?: string;
}

export interface AgentSession {
  id: string;
  name: string;
  startTime: number;
  lastActive: number;
  entries: MemoryEntry[];
}

export interface AppState {
  sessions: Record<string, AgentSession>;
  currentSession: string | null;
  theme: string;
  mode: string;
  team: string;
}

const STATE_DIR = "/home/zerwiz/woh/.alloy";
const STATE_FILE = join(STATE_DIR, "state.json");

export function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function loadState(): AppState {
  ensureStateDir();
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {}
  return {
    sessions: {},
    currentSession: null,
    theme: "nord",
    mode: "single",
    team: "all",
  };
}

export function saveState(state: AppState): void {
  ensureStateDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function createSession(name: string): AgentSession {
  const id = `session-${Date.now()}`;
  return {
    id,
    name,
    startTime: Date.now(),
    lastActive: Date.now(),
    entries: [],
  };
}

export function addEntry(session: AgentSession, entry: Omit<MemoryEntry, "id" | "timestamp">): void {
  session.entries.push({
    ...entry,
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  session.lastActive = Date.now();
}

export function getHistory(session: AgentSession, limit = 10): MemoryEntry[] {
  return session.entries.slice(-limit);
}

export function getAgentHistory(session: AgentSession, agentName: string): MemoryEntry[] {
  return session.entries.filter(e => e.agent === agentName);
}

export function getToolHistory(session: AgentSession, toolName: string): MemoryEntry[] {
  return session.entries.filter(e => e.tool === toolName);
}

export function setTheme(themeName: string): void {
  const state = loadState();
  state.theme = themeName;
  saveState(state);
}

export function setMode(modeName: string): void {
  const state = loadState();
  state.mode = modeName;
  saveState(state);
}

export function setTeam(teamName: string): void {
  const state = loadState();
  state.team = teamName;
  saveState(state);
}

export function getCurrentSession(): AgentSession | null {
  const state = loadState();
  if (!state.currentSession) return null;
  return state.sessions[state.currentSession] || null;
}

export function startNewSession(agentName: string = "default"): AgentSession {
  const state = loadState();
  const session = createSession(agentName);
  state.sessions[session.id] = session;
  state.currentSession = session.id;
  saveState(state);
  return session;
}

if (import.meta.url === process.argv[1] || process.argv[1]?.includes("memory.ts")) {
  const state = loadState();
  console.log("Current state:");
  console.log(`  Theme: ${state.theme}`);
  console.log(`  Mode: ${state.mode}`);
  console.log(`  Team: ${state.team}`);
  console.log(`  Sessions: ${Object.keys(state.sessions).length}`);
  
  const session = startNewSession("test");
  console.log(`\nCreated session: ${session.id}`);
  
  addEntry(session, { type: "task", content: "Hello world" });
  console.log("Added entry");
  console.log("History:", getHistory(session));
}