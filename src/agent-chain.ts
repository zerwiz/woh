#!/usr/bin/env node

/**
 * Alloy Agent - Chain Mode UI
 * 
 * Sequential pipeline - agents run one after another
 */

import { readFileSync } from "fs";
import { join } from "path";

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";

const CHAINS = {
  "plan-build": ["planner", "builder"],
  "plan-build-review": ["planner", "builder", "reviewer"],
  "scout-flow": ["scout", "scout", "scout"],
  "full-review": ["scout", "planner", "builder", "reviewer"],
};

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";
const ACCENT = "\x1b[38;2;136;192;208m";
const SUCCESS = "\x1b[38;2;163;190;140m";

let chainName = "plan-build-review";
let task = "";
let pipelineResults: string[] = [];

async function chat(model: string, messages: {role: string, content: string}[]): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });
  const data = await response.json();
  return data.message?.content || "No response";
}

async function runChainMode() {
  const chain = CHAINS[chainName as keyof typeof CHAINS] || CHAINS["plan-build-review"];
  
  console.clear();
  console.log(` ${ACCENT}╔${"═".repeat(50)}╗${RESET}`);
  console.log(` ${ACCENT}║${GRAY}        Alloy Agent - Chain Mode          ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Chain: ${SUCCESS}${chainName}${GRAY}                           ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}║${GRAY}  Steps: ${chain.join(" → ")}${GRAY}               ${ACCENT}║${RESET}`);
  console.log(` ${ACCENT}╚${"═".repeat(50)}╝${RESET}`);
  console.log("");
  console.log(` ${GRAY}Task: ${task}${RESET}`);
  console.log("");
  
  let input = task;
  
  // Run each agent sequentially, passing output to next
  for (let i = 0; i < chain.length; i++) {
    const agent = chain[i];
    console.log(` ${ACCENT}▶ Step ${i + 1}/${chain.length}: @${agent}${RESET}`);
    
    try {
      const response = await chat(DEFAULT_MODEL, [
        { role: "system", content: `You are the ${agent} agent. Complete your step of the pipeline.` },
        { role: "user", content: `Input: ${input}\nTask: ${task}` }
      ]);
      pipelineResults.push(response);
      console.log(`   ${SUCCESS}✓ ${response.slice(0, 100)}...${RESET}`);
      input = response; // Pass to next agent
    } catch (e: any) {
      console.log(`   ✗ ${e.message}`);
    }
  }
  
  console.log("");
  console.log(` ${ACCENT}═══════════════════════════════════════════════${RESET}`);
  console.log(` ${ACCENT}Pipeline Complete:${RESET}`);
  console.log("");
  
  for (let i = 0; i < chain.length; i++) {
    console.log(` ${ACCENT}Step ${i + 1} (@${chain[i]}):${RESET}`);
    console.log(`   ${pipelineResults[i]?.slice(0, 200) || "(no result)"}`);
    console.log("");
  }
}

async function main() {
  task = process.argv.slice(2).join(" ") || "Create a simple web app";
  chainName = process.argv[2] || "plan-build-review";
  
  if (!CHAINS[chainName as keyof typeof CHAINS]) {
    console.log(`Invalid chain: ${chainName}`);
    console.log(`Available: ${Object.keys(CHAINS).join(", ")}`);
    process.exit(1);
  }
  
  await runChainMode();
}

main();