#!/usr/bin/env node

/**
 * Alloy Agent CLI - Simple Ollama Chat
 * 
 * Simple CLI to chat with Ollama without complex TUI dependencies.
 */

const DEFAULT_MODEL = "qwen3.5:9b";
const OLLAMA_URL = "http://localhost:11434";

async function checkOllama(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

async function chat(url: string, model: string, messages: {role: string, content: string}[]): Promise<string> {
  const response = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });
  
  const data = await response.json();
  return data.message?.content || "No response";
}

async function main() {
  // Get task from command line
  const task = process.argv.slice(2).join(" ");
  
  console.log("Alloy Agent CLI");
  console.log("===========\n");
  
  // Check Ollama
  console.log(`Checking Ollama at ${OLLAMA_URL}...`);
  const ollamaOk = await checkOllama(OLLAMA_URL);
  
  if (!ollamaOk) {
    console.error(`\nError: Ollama not running at ${OLLAMA_URL}`);
    console.error("Start Ollama with: ollama serve");
    process.exit(1);
  }
  
  console.log("Ollama connected.\n");
  
  if (!task) {
    console.log("Usage: node cli.ts <task>");
    console.log("       node cli.ts 'Hello, how are you?'");
    console.log("");
    console.log("Available models on Ollama:");
    
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`);
      const data = await res.json();
      for (const m of data.models || []) {
        console.log(`  - ${m.name}`);
      }
    } catch (e: any) {
      console.error("Error fetching models:", e.message);
    }
  } else {
    const messages = [{ role: "user", content: task }];
    console.log(`Processing: ${task}\n`);
    
    const response = await chat(OLLAMA_URL, DEFAULT_MODEL, messages);
    console.log("\nResponse:");
    console.log(response);
    console.log("");
  }
}

main().catch(console.error);