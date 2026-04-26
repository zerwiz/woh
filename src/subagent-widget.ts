#!/usr/bin/env node

/**
 * Alloy Agent - Subagent Widget UI
 * 
 * Background subagent management
 */

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";
const ACCENT = "\x1b[38;2;136;192;208m";
const SUCCESS = "\x1b[38;2;163;190;140m";

interface Subagent {
  name: string;
  task: string;
  status: string;
}

const subagents: Subagent[] = [];

function showHeader() {
  console.clear();
  console.log(` ${ACCENT}╔${"═".repeat(50)}╗${RESET}`);
  console.log(` ${ACCENT}║${GRAY}        Alloy Agent - Subagents              ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Background worker management            ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}╚${"═".repeat(50)}╝${RESET}`);
  console.log("");
}

function showSubagents() {
  console.log(` ${ACCENT}Active Subagents:${RESET}`);
  if (subagents.length === 0) {
    console.log(` ${GRAY}  (none - use /sub add <task> to start)${RESET}`);
  } else {
    subagents.forEach(s => {
      console.log(`  - ${s.name}: ${s.status} - ${s.task}`);
    });
  }
  console.log("");
}

const input = process.argv.slice(2).join(" ");

showHeader();

if (input.startsWith("add ")) {
  const task = input.replace(/^(add|sub)\s+/, "").trim();
  if (task) {
    const name = "sub" + subagents.length;
    subagents.push({ name, task, status: "running" });
    console.log(` ${SUCCESS}Started subagent: ${name}${RESET}`);
    console.log(`  Task: ${task}`);
    showSubagents();
  }
} else if (input === "list" || input === "") {
  showSubagents();
} else if (input === "clear") {
  subagents.length = 0;
  console.log(` ${SUCCESS}Cleared all subagents${RESET}`);
  showSubagents();
} else {
  showSubagents();
}