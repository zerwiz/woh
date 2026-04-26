# Alloy Agent - Main justfile
# Run all UI modes and configurations

set dotenv-load := true

DEFAULT_MODEL := "qwen3.5:9b"
OLLAMA_URL := "http://localhost:11434"
SRC_DIR := "/home/zerwiz/woh/src"

# Default: show help
default:
    @just --list

# ==================== Core CLI ====================

# Interactive chat (main agent - default)
tui:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

# Simple CLI (non-interactive - single prompt)
cli TASK="":
    cd /home/zerwiz/woh/src && npx tsx cli.ts "{{ TASK }}"

# ==================== UI Modes ====================

# Agent chain mode (sequential pipeline)
chain CHAIN TASK="":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "--chain {{ CHAIN }} {{ TASK }}"

# Agent team mode (parallel dispatch)
team TEAM TASK="":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "--team {{ TEAM }} {{ TASK }}"

# ==================== Full UI Files ====================

# agent-chain.ts
agent-chain TASK="":
    cd /home/zerwiz/woh/src && npx tsx agent-chain.ts "{{ TASK }}"

# agent-team.ts
agent-team TASK="":
    cd /home/zerwiz/woh/src && npx tsx agent-team.ts "{{ TASK }}"

# subagent-widget.ts
subagent-widget TASK="":
    cd /home/zerwiz/woh/src && npx tsx subagent-widget.ts "{{ TASK }}"

# tilldone.ts
tilldone TASK="":
    cd /home/zerwiz/woh/src && npx tsx tilldone.ts "{{ TASK }}"

# tool-counter-widget.ts
tool-counter-widget TASK="":
    cd /home/zerwiz/woh/src && npx tsx tool-counter-widget.ts "{{ TASK }}"

# ==================== Agent Dispatch ====================

dispatch AGENT TASK:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@{{ AGENT }} {{ TASK }}"

architect TASK="@architect":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@architect {{ TASK }}"

builder TASK="@builder":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@builder {{ TASK }}"

scanner TASK="@scanner":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@scanner {{ TASK }}"

tester TASK="@tester":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@tester {{ TASK }}"

frontend TASK="@frontend":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@frontend {{ TASK }}"

planner TASK="@planner":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@planner {{ TASK }}"

reviewer TASK="@reviewer":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@reviewer {{ TASK }}"

# ==================== Theme Commands ====================

theme NAME:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "--theme {{ NAME }}"

themes:
    cd /home/zerwiz/woh/src && npx tsx lib/themes.ts

theme-cycle:
    cd /home/zerwiz/woh/src && npx tsx theme-cycler.ts

# ==================== Tool Commands ====================

ls DIR=".":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "ls {{ DIR }}"

read FILE:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "read {{ FILE }}"

write FILE CONTENT:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "write {{ FILE }} {{ CONTENT }}"

grep PATTERN DIR=".":
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "grep {{ PATTERN }} {{ DIR }}"

bash CMD:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "bash {{ CMD }}"

# ==================== Damage Control ====================

check CMD:
    cd /home/zerwiz/woh/src && npx tsx lib/damage-control.ts "{{ CMD }}"

# ==================== Memory/Sessions ====================

state:
    cd /home/zerwiz/woh/src && npx tsx lib/memory.ts

new-session NAME="default":
    cd /home/zerwiz/woh/src && npx tsx lib/memory.ts "new {{ NAME }}"

# ==================== Teams & Chains ====================

teams:
    cd /home/zerwiz/woh/src && npx tsx lib/modes.ts

chains:
    cd /home/zerwiz/woh/src && npx tsx lib/modes.ts

agents:
    cd /home/zerwiz/woh/src && npx tsx lib/agents.ts

# ==================== Common Tasks ====================

analyze:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@architect Analyze the project structure"

build FILE CONTENT:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@builder Create {{ FILE }} with {{ CONTENT }}"

scan:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@scanner List all TypeScript files"

test:
    cd /home/zerwiz/woh/src && npx tsx cli-tui.ts "@tester Run the test suite"

# ==================== Alloy Agent ====================

start TASK="":
    /home/zerwiz/woh/alloy_agent/start.sh "{{ TASK }}"

just RECIPE ARGS="":
    just {{ RECIPE }} {{ ARGS }}