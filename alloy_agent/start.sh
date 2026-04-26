#!/bin/bash

# Alloy Agent Launcher Script
# Routes all agent operations to /home/zerwiz/woh/alloy-agent

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELIXIR_PATH="/usr/bin/elixir"

echo "=========================================="
echo "  Alloy Agent Launcher"
echo "=========================================="
echo "Agent Location: ${SCRIPT_DIR}"

# Function to check and install dependencies
check_dependencies() {
    echo ""
    echo "Checking dependencies..."

    # Check if elixir is installed
    if [ ! -f "${ELIXIR_PATH}" ]; then
        echo "Error: Elixir not found at ${ELIXIR_PATH}"
        echo "Please install Elixir: sudo apt update && sudo apt install elixir erlang"
        exit 1
    fi

    # Check if lib directory exists
    if [ ! -d "${SCRIPT_DIR}/lib" ]; then
        echo "Error: lib directory not found"
        echo "The agent code should be in ${SCRIPT_DIR}/lib"
        exit 1
    fi

    # Check if mix.lock exists (dependencies)
    if [ ! -f "${SCRIPT_DIR}/mix.lock" ]; then
        echo "No mix.lock found. Getting dependencies..."
        mix deps.get || {
            echo "Failed to get dependencies"
            exit 1
        }
    fi
}

# Function to compile the agent
compile_agent() {
    echo "Compiling agent..."
    mix compile || {
        echo "Compilation failed"
        exit 1
    }
}

# Function to run the agent
run_agent() {
    echo "Starting alloy agent..."
    echo "Run file: ${SCRIPT_DIR}/lib/alloy_agent.ex"

    # Check if the run file exists
    if [ ! -f "${SCRIPT_DIR}/lib/alloy_agent.ex" ]; then
        echo "Warning: alloy_agent.ex not found, trying to run from root lib..."
        # Try to find and run the agent
        RUN_FILE=$(find "${SCRIPT_DIR}/lib" -name "alloy_agent.ex" 2>/dev/null | head -1)

        if [ -n "${RUN_FILE}" ]; then
            echo "Found: ${RUN_FILE}"
        else
            echo "Error: Could not find alloy_agent.ex"
            exit 1
        fi
    fi

    # Run the agent
    elixir -S mix run "${SCRIPT_DIR}/lib/alloy_agent.ex"
}

# Main execution
echo ""
echo "Running alloy agent..."

# Execute with proper routing
if check_dependencies && compile_agent; then
    run_agent
else
    echo "Failed to start alloy agent"
    exit 1
fi

echo ""
echo "Agent finished (or running in background)"
