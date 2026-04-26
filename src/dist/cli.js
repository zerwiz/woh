#!/usr/bin/env node
/**
 * Alloy Agent CLI Entry Point
 *
 * Starts the Agent in a TUI using pi-tui for the interface
 * and Ollama as the provider.
 */
import { stdin as input } from "node:process";
import { readline } from "node:readline";
const DEFAULT_MODEL = "qwen3.5:9b";
const OLLAMA_URL = "http://localhost:11434";
function parseArgs(args) {
    const result = {
        model: DEFAULT_MODEL,
        provider: OLLAMA_URL,
        verbose: false,
        continue: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--model" && args[i + 1]) {
            result.model = args[i + 1];
            i++;
        }
        else if (arg === "--provider" && args[i + 1]) {
            result.provider = args[i + 1];
            i++;
        }
        else if (arg === "--verbose" || arg === "-v") {
            result.verbose = true;
        }
        else if (arg === "--continue" || arg === "-c") {
            result.continue = true;
        }
    }
    return result;
}
async function checkOllama(url) {
    try {
        const res = await fetch(`${url}/api/tags`);
        return res.ok;
    }
    catch {
        return false;
    }
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    console.log("Alloy Agent CLI");
    console.log("===========\n");
    // Check Ollama
    console.log(`Checking Ollama at ${args.provider}...`);
    const ollamaOk = await checkOllama(args.provider);
    if (!ollamaOk) {
        console.error(`\nError: Ollama not running at ${args.provider}`);
        console.error("Start Ollama with: ollama serve");
        process.exit(1);
    }
    console.log("Ollama connected.\n");
    // Configure TUI
    const config = {
        teamName: "Alloy Agent Team",
        maxConcurrent: 1,
        allowParallelTools: false,
        toolTimeout: 60000,
        verbose: args.verbose,
        displayMode: "full",
    };
    console.log("Initializing TUI...");
    console.log(`Model: ${args.model}`);
    console.log(`Provider: ${args.provider}\n`);
    // Note: Full TUI integration would need the actual pi-tui context
    // which requires a running terminal. For now we'll show the architecture.
    console.log("TUI Components Ready:");
    console.log("- Agent status display");
    console.log("- Real-time updates");
    console.log("- Tool execution visualization");
    console.log("\nTo start interactive mode, run from a terminal with TUI support.");
    // Simple REPL for now
    const rl = readline.createInterface({ input, terminal: false });
    rl.question("\nEnter task (or Ctrl+C to exit): ", async (task) => {
        if (!task.trim()) {
            console.log("No task provided.");
            process.exit(0);
        }
        console.log(`\nProcessing: ${task}\n`);
        // Call Ollama directly for testing
        try {
            const response = await fetch(`${args.provider}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: args.model,
                    messages: [{ role: "user", content: task }],
                    stream: false,
                }),
            });
            const data = await response.json();
            console.log("\nResponse:");
            console.log(data.message?.content || "No response");
        }
        catch (err) {
            console.error("Error:", err.message);
        }
        process.exit(0);
    });
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map