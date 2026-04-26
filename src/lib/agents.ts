#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, basename } from "path";

export interface Agent {
  name: string;
  description: string;
  prompt: string;
  tools: string[];
  skills: string[];
  enabled: boolean;
}

const AGENTS_DIR = "/home/zerwiz/woh/alloy_agent/agents";

export function loadAgent(name: string): Agent | null {
  const mdPath = join(AGENTS_DIR, `${name}.md`);
  const yamlPath = join(AGENTS_DIR, `${name}.yaml`);
  
  try {
    if (existsSync(mdPath)) {
      return parseAgentMarkdown(name, readFileSync(mdPath, "utf-8"));
    }
    if (existsSync(yamlPath)) {
      return parseAgentYaml(name, readFileSync(yamlPath, "utf-8"));
    }
  } catch (e) {
    console.error(`Failed to load agent ${name}:`, e);
  }
  return null;
}

function parseAgentMarkdown(name: string, content: string): Agent {
  const lines = content.split("\n");
  let description = "";
  let prompt = "";
  let tools: string[] = [];
  let skills: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith("## ")) {
      description = line.replace("## ", "").trim();
    } else if (line.startsWith("### ")) {
      prompt += line.replace("### ", "").trim() + "\n";
    } else if (!line.startsWith("#") && prompt) {
      prompt += line + "\n";
    }
    if (line.includes("tool:") || line.includes("tools:")) {
      const match = line.match(/tools?:\s*\[?([^\]]+)\]?/);
      if (match) {
        tools = match[1].split(",").map(t => t.trim().replace(/['"]/g, ""));
      }
    }
    if (line.includes("skill:") || line.includes("skills:")) {
      const match = line.match(/skills?:\s*\[?([^\]]+)\]?/);
      if (match) {
        skills = match[1].split(",").map(s => s.trim().replace(/['"]/g, ""));
      }
    }
  }
  
  return {
    name,
    description: description || name,
    prompt: prompt.trim() || `You are ${name}.`,
    tools,
    skills,
    enabled: true,
  };
}

function parseAgentYaml(name: string, content: string): Agent {
  const lines = content.split("\n");
  let description = "";
  let tools: string[] = [];
  let skills: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith("description:")) {
      description = line.replace("description:", "").trim();
    }
    if (line.startsWith("tools:")) {
      const match = line.match(/tools:\s*\[?([^\]]+)\]?/);
      if (match) {
        tools = match[1].split(",").map(t => t.trim().replace(/['"]/g, ""));
      }
    }
    if (line.startsWith("skills:")) {
      const match = line.match(/skills:\s*\[?([^\]]+)\]?/);
      if (match) {
        skills = match[1].split(",").map(s => s.trim().replace(/['"]/g, ""));
      }
    }
  }
  
  return {
    name,
    description,
    prompt: `You are ${name}. ${description}`,
    tools,
    skills,
    enabled: true,
  };
}

export function loadAllAgents(): Record<string, Agent> {
  const agents: Record<string, Agent> = {};
  const defaultAgents = [
    "architect", "builder", "scanner", "tester",
    "frontend", "planner", "reviewer", "plan-reviewer",
    "red-team", "documenter", "scout", "bowser",
    "agentbuilder", "skillbuilder", "pi-dev-expert",
    "ext-builder", "agenttemplate", "session-manager",
  ];
  
  for (const name of defaultAgents) {
    const agent = loadAgent(name);
    if (agent) {
      agents[name] = agent;
    }
  }
  
  return agents;
}

export function listAgentNames(): string[] {
  const agents = loadAllAgents();
  return Object.keys(agents);
}

if (import.meta.url === process.argv[1] || process.argv[1]?.includes("agents.ts")) {
  const agents = loadAllAgents();
  console.log("Loaded agents:", Object.keys(agents).join(", "));
  console.log("");
  for (const [name, agent] of Object.entries(agents)) {
    console.log(`- ${name}: ${agent.description}`);
    console.log(`  tools: ${agent.tools.join(", ")}`);
    console.log(`  skills: ${agent.skills.join(", ")}`);
  }
}