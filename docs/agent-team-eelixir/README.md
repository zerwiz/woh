# Agent Team Implementation in Elixir

This directory contains documentation for implementing the Pi agent team functionality in Elixir with OTP primitives.

## Purpose

The Pi system (`/home/zerwiz/woh/piwithstuff/extensions/agent-team.ts`) uses a **dispatcher-only orchestrator** pattern where the primary agent delegates work to specialist agents. This documentation explains how to implement the same functionality in Elixir.

## Architecture

| Component | Pi (TypeScript) | Elixir (OTP) |
|-----------|------------------|--------------|
| Dispatcher | Primary agent | `AlloyAgent.Server` |
| Specialists | Per-agent Pi session | `AlloyAgent.Server` per agent |
| Memory | `.json` session files | `AlloyAgent.Memory` (ETs/Disk) |
| Teams | `teams.yaml` + commands | `AlloyAgent.Team` + supervision |
| State | In-memory Map | GenServer state |
| Isolation | Separate processes | OTP process isolation |

## Core Components to Implement

1. **Agent Registry** - Central registry for agent definitions and team membership
2. **Definition Parser** - Parse agent `.md` files (similar to `parseAgentFile`)
3. **State Management** - Track agent status, task, tools, elapsed time
4. **Memory System** - Per-agent memory store (disk or in-memory)
5. **Session Management** - Per-agent sessions for cross-invocation memory
6. **Team Management** - Switch, add, remove agents from teams
7. **Dispatcher** - Spawn agents and handle task dispatching
8. **Tool Registration** - `switch_team`, `manage_team`, `dispatch_agent`

## Implementation Path

### Quick Start

```bash
# Add dependencies to mix.exs
defp deps do
  [
    {:alloy, "~> 0.12"},
    {:alloy_agent, "~> 0.1"},
    {:poison, "~> 5"}
  ]
end

# Create agent definition files
mkdir -p .pi/agents
# Example: .pi/agents/architect.md with frontmatter

# Create teams.yaml
# .pi/agents/teams.yaml
# all:
#   - architect
#   - builder
#   - scanner
#   - tester

# Start the supervisor
AlloyAgent.start_link([])
```

### Detailed Guide

See [`AGENT_TEAM_EELIXIR.md`](./AGENT_TEAM_EELIXIR.md) for:

- **Architecture comparison** - Pi vs Elixir patterns
- **Core component implementations** - Code examples for each module
- **Directory structure** - How to organize your project
- **Migration strategy** - Step-by-step implementation plan
- **Error handling** - Similar to Pi's error cases
- **Testing strategy** - Unit and integration tests
- **Next steps** - What to implement first

## Key Files

| File | Description |
|------|-------------|
| [`AGENT_TEAM_EELIXIR.md`](./AGENT_TEAM_EELIXIR.md) | Complete implementation guide with code examples |
| This README | High-level overview and quick start |

## Questions

- **Do you need full TUI rendering?** Consider LiveView or simple terminal status updates
- **Should agents persist across restarts?** Use `AlloyAgent.Memory.Disk` for persistence
- **Do you need streaming responses?** Use `Stream` with backpressure handling
- **Should tools be file-based or in-memory?** Cache in memory or use `Alloy.Memory`

## Reference

- Pi system: `/home/zerwiz/woh/piwithstuff/extensions/agent-team.ts`
- Existing migration: `/home/zerwiz/woh/docs/MIGRATION-alloy_agent.md`
- Alloy protocol: See Alloy GitHub repo for base protocol modules

## Contributing

This documentation is a work in progress. Update it as you implement the agent team functionality in Elixir.