#!/bin/bash

# Alloy Agent Launcher
# Starts the TUI with Ollama provider

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="/home/zerwiz/woh/src"
NPM_CMD="npx tsx"
OLLAMA_URL="http://localhost:11434"

echo "=========================================="
echo "  Alloy Agent Launcher"
echo "=========================================="
echo "Location: ${SCRIPT_DIR}"
echo ""

# Function to check Ollama
check_ollama() {
    echo "Checking Ollama at ${OLLAMA_URL}..."
    if curl -s "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
        echo "Ollama is running."
        return 0
    else
        echo "Error: Ollama not running at ${OLLAMA_URL}"
        echo "Start Ollama with: ollama serve"
        return 1
    fi
}

# Function to run the agent
run_agent() {
    cd "${SRC_DIR}"
    
    if [ $# -eq 0 ]; then
        # No args - show help
        echo ""
        echo "Usage: ./start.sh '<task>'"
        echo "       ./start.sh '@architect design a system'"
        echo "       ./start.sh '@scanner ls src'"
        echo ""
        echo "Examples:"
        echo "  ./start.sh 'What is the project structure?'"
        echo "  ./start.sh '@builder create a new file'"
        echo "  ./start.sh '@scanner ls /home/zerwiz/woh/src'"
        echo ""
        echo "Tools: read, write, ls, grep, bash"
        echo "Skills: analyze, deduce, synthesize"
        echo "Agents: architect, builder, scanner, tester"
        echo ""
        echo "To dispatch to a specific agent, use @agent syntax:"
        echo "  @architect <task>  - Architecture decisions"
        echo "  @builder <task>     - Code implementation"  
        echo "  @scanner <task>    - Discovery & file operations"
        echo "  @tester <task>     - Validation"
        echo ""
        exit 0
    fi
    
    echo "Starting Alloy Agent TUI..."
    echo ""
    
    ${NPM_CMD} cli-tui.ts "$@"
}

# Main execution
if check_ollama; then
    run_agent "$@"
else
    echo ""
    echo "Please start Ollama first:"
    echo "  ollama serve"
    exit 1
fi

echo ""
echo "Agent finished"