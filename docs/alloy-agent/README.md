# Alloy Agent

A multi-agent Elixir system with specialized agents for system development tasks.

## Overview

The Alloy Agent is an Elixir-based multi-agent framework that orchestrates specialized AI agents to collaborate on software engineering tasks. Each agent has specific capabilities and tools.

## Quick Start

```elixir
# Start application
AlloyAgent.Application.start()

# Get all agents
AlloyAgent.agents()
# ["architect", "builder", "scanner", "tester"]

# Get all tools
AlloyAgent.tools()
# ["read", "write", "ls", "find", "grep", "bash", "edit"]

# Get agent info
AlloyAgent.agent_info("architect")
# %{name: "architect", tools: [], description: "Architecture agent"}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AlloyAgent.Application                   │
│                   (Supervision Tree)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │Architect │  │ Builder  │  │ Scanner  │  │   Tester   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Core Modules                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────────────┐  │
│  │Memory  │ │ Session│ │ State  │ │      Registry        │  │
│  └────────┘ └────────┘ └────────┘ └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  Tool/Skill System                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tools (read, write, edit, bash, grep, find, ls)      │   │
│  │  Skills (deduce, analyze, synthesize, imagine)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Agents

| Agent | Role | Tools | Description |
|-------|------|-------|-------------|
| architect | Core | bash | Architecture design and orchestration |
| builder | Builder | write | Code implementation |
| scanner | Scanner | read, ls, find, grep, bash | System discovery |
| tester | Tester | bash, read | Validation & testing |

## Available Tools

### File Operations
- `read` - Read files
- `write` - Write files  
- `edit` - Edit files
- `ls` - List directories

### Search Operations
- `find` - Find files
- `grep` - Search content

### System Operations
- `bash` - Run shell commands

## Directory Structure

```
alloy_agent/
├── agent.ex              # Core agent operations
├── core.ex              # PI agent core functions
├── state.ex             # Agent runtime state
├── session.ex           # Session management
├── memory.ex            # Memory store (in-memory/disk)
├── definition.ex        # Definition parsing (frontmatter)
├── agent_def.ex         # Core agent definition
├── agent_definition.ex # Full definition API
├── registry.ex          # Agent & tool registry
├── dispatcher.ex       # Task dispatching
├── tools.ex            # Tool execution
├── supervisor.ex       # Process supervision
├── provider.ex         # AI provider interface
├── team.ex             # Team coordination
├── application.ex      # Supervision tree
├── start.sh            # Launcher script
├── agent/              # Nested Alloy framework
│   ├── alloy.ex        # Main API
│   ├── config.ex      # Configuration
│   ├── server.ex      # Agent server
│   ├── state.ex       # Agent state
│   ├── turn.ex        # Turn processing
│   └── events.ex      # Event handling
├── memory/             # Memory implementations
│   ├── disk.ex        # Disk-backed storage
│   ├── in_memory.ex  # ETS in-memory
│   ├── ex.ex         # Extended memory
│   └── router.ex     # Memory routing
└── providers/         # AI providers
```

## Dependencies

- **Elixir** - Runtime (required)
- **OTP** - Process supervision
- **Tools** - File operations in `/home/zerwiz/woh/tools/`
  - `executor.ex` - Tool execution engine
  - `file_search.ex` - File search
  - `web_search.ex` - Web search
  - `secure_shell.ex` - Secure bash execution
- **Skills** - Cognitive abilities in `/home/zerwiz/woh/skills/`
  - `analyze.ex` - Analysis skill
  - `deduce.ex` - Deduction skill
  - `synthesis.ex` - Synthesis skill
  - `registry.ex` - Skill registry

## Configuration

See `config/config.exs` for setup options.

## License

MIT