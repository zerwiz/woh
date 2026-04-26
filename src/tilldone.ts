#!/usr/bin/env node

/**
 * Alloy Agent - TillDone UI
 * 
 * Task tracking - define tasks before working
 */

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";
const ACCENT = "\x1b[38;2;136;192;208m";
const SUCCESS = "\x1b[38;2;163;190;140m";

interface Task {
  id: number;
  text: string;
  done: boolean;
}

const tasks: Task[] = [];
let nextId = 1;

function showHeader() {
  console.clear();
  console.log(` ${ACCENT}╔${"═".repeat(50)}╗${RESET}`);
  console.log(` ${ACCENT}║${GRAY}        Alloy Agent - TillDone            ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Task tracking - define before working  ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}╚${"═".repeat(50)}╝${RESET}`);
  console.log("");
}

function showTasks() {
  console.log(` ${ACCENT}Tasks:${RESET}`);
  if (tasks.length === 0) {
    console.log(` ${GRAY}  (none - use /todo add <task> to add)${RESET}`);
  } else {
    tasks.forEach(t => {
      const check = t.done ? `${SUCCESS}✓` : " ";
      console.log(`  [${check}] #${t.id}: ${t.text}`);
    });
  }
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  console.log(` ${GRAY}  Progress: ${done}/${tasks.length} done${RESET}`);
  console.log("");
}

const input = process.argv.slice(2).join(" ");
const parts = input.split(" ");
const cmd = parts[0];

showHeader();

if (input.startsWith("add ")) {
  const text = input.replace(/^(add|todo)\s+/, "").trim();
  if (text) {
    tasks.push({ id: nextId++, text, done: false });
    console.log(` ${SUCCESS}Added task #${nextId - 1}: ${text}${RESET}`);
    showTasks();
  }
} else if (input.startsWith("done ")) {
  const id = parseInt(input.replace("done ", ""));
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = true;
    console.log(` ${SUCCESS}Task #${id} marked done${RESET}`);
    showTasks();
  } else {
    console.log(` ${GRAY}Task #${id} not found${RESET}`);
  }
} else if (input === "clear") {
  const undone = tasks.filter(t => !t.done);
  undone.forEach(t => { t.done = false; });
  console.log(` ${SUCCESS}Cleared done tasks${RESET}`);
  showTasks();
} else {
  showTasks();
}