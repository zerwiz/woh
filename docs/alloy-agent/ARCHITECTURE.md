# Alloy Agent Architecture

Detailed system architecture and component interactions.

## Overview

The Alloy Agent is built on Elixir/OTP with a modular architecture supporting:
- Multiple specialized agents
- Tool execution
- Cognitive skills
- Memory management
- Session tracking

## System Layers

```
┌────────────────────────────────────────────────────────────────┐
│           Presentation Layer                       │
│    User Interface / API / CLI                  │
└─────────────────────────────────┬──────────┘
                                  │
┌─────────────────────────────────▼──────────┐
│           Agent Layer                         │
│  ┌─────────────────────────────────────┐   │
│  │    AlloyAgent.Registry               │   │
│  │  (Agent/Team/Tool lookup)           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │    AlloyAgent.Dispatcher             │   │
│  │  (Task routing & execution)         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │    AlloyAgent.Tools                │   │
│  │  (File, bash, search)              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────┬──────────┘
                                  │
┌─────────────────────────────────▼──────────┐
│           Core Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ State    │ │ Session │ │ Memory │ │
│  └──────────┘ └──────────┘ └─────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Provider │ │ Supervisor│ │ Team    │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────┬──────────┘
                                  │
┌─────────────────────────────────▼──────────┐
│           Runtime Layer                      │
│         OTP / Elixir VM                     │
└───────────────────────────────────────────┘
```

## Core Components

### Application Supervisor

`AlloyAgent.Application` defines the supervision tree:

```elixir
children = [
  AlloyAgent.Memory,        # Memory store
  AlloyAgent.Registry,      # Agent registry
  AlloyAgent.TEAM.Supervisor  # Team supervisor (spawns individual agents)
]
```

### Agent Types

| Module | Role | Purpose |
|--------|------|---------|
| `AlloyAgent.Agent.Architect` | Orchestration | Coordinate tasks |
| `AlloyAgent.Agent.Builder` | Implementation | Write code |
| `AlloyAgent.Agent.Scanner` | Discovery | Find components |
| `AlloyAgent.Agent.Tester` | Validation | Test builds |

### State Machine

Each agent operates as a state machine:

```
:idle → :running → :completed
           ↓
        :error
           ↓
        :aborted
```

### Session Management

Sessions track:
- Conversation history
- Turn count
- Tool usage
- Output accumulation
- Max turn limits

## Data Flow

### Task Execution

```
User Request
    │
    ▼
Dispatcher.dispatch(task)
    │
    ▼
Registry.lookup(agent)
    │
    ▼
State.new(agent) ─→ Session.new(agent)
    │
    ▼
Tools.execute(task)
    │
    ▼
State.finish(output)
    │
    ▼
Result
```

### Memory Flow

```
Agent Action
    │
    ▼
Memory.put(agent, key, value)
    │
    ▼
[Disk] or [ETS]
    │
    ▼
Memory.get(agent, key)
    │
    ▼
Return to Agent
```

## Module Dependencies

```
application.ex
    │
    ├── team.ex
    │       │
    │       └── team.ex
    │
    ├── supervisor.ex
    │       │
    │       └── (OTP Supervisor)
    │
    ├── agent.ex ───────► core.ex
    │       │                 │
    │       │                 ├── registry.ex
    │       │                 │
    │       │                 ├── state.ex
    │       │                 │
    │       │                 └── session.ex
    │       │
    │       └── agent_def.ex
    │                   │
    │                   └── definition.ex
    │
    ├── provider.ex ─────────► (AI Provider)
    │
    ├── dispatcher.ex ─────────► tools.ex
    │       │
    │       ├── registry.ex
    │       └── memory.ex
    │
    └── memory.ex
            │
            ├── memory/disk.ex
            └── memory/in_memory.ex
```

## Key Interfaces

### Agent Definition

```elixir
defstruct [
  name: String.t(),
  description: String.t(),
  team: String.t(),
  tools: [String.t()],
  skills: [String.t()],
  priority: float()
]
```

### Provider Interface

```elixir
defcallback complete(messages :: list()) :: {:ok, Map.t()} | {:error, term()}
defcallback stream(messages :: list()) :: :stream_started | :stream_completed | :stream_error
defcallback error(error :: term()) :: term()
defcallback metadata() :: Map.t()
```

### Tool Interface

```elixir
defcallback execute(input :: map(), context :: map()) :: {:ok, term()} | {:error, term()}
```

### Skill Interface

```elixir
defcallback apply(input :: map()) :: {:ok, term()} | {:error, term()}
```

## Concurrency Model

### Task Execution

The `dispatcher.ex` module supports:
- Sequential tool execution
- Parallel tool execution via `Task.Supervisor`
- Timeout handling
- Error recovery

### Process Structure

```
                    ┌─────────────────┐
                    │  Supervisor      │
                    │ (TEAM.Supervisor)│
                    └────────┬────────┘
                             │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────┐           ┌─────────┐           ┌─────────┐
   │Architect│           │ Builder │           │ Scanner │
   │  GenServer       │  GenServer       │  GenServer
   └─────────┘           └─────────┘           └─────────┘
```

## Extending the System

### Adding New Agents

1. Define in `registry.ex`:
```elixir
{:my_agent, %{name: "my_agent", tools: [...], team: "all"}}
```

2. Add to `application.ex`:
```elixir
AlloyAgent.Agent.MyAgent
```

### Adding New Tools

1. Add tool module in `tools/`
2. Register in `registry.ex`:
```elixir
{:my_tool, {:category, "Description", :my_tool}}
```

### Adding New Skills

1. Add skill module in `skills/`
2. Register in `skill_registry.ex`:
```elixir
register("my_skill", "Description", &handler/1)
```

## Persistence

### Memory Stores

| Type | Use Case | Location |
|------|---------|----------|
| In-Memory (ETS) | Fast, Ephemeral | RAM |
| Disk | Persistent | Filesystem |

### Session Storage

Sessions can be stored in memory or persisted to disk for later continuation.

## Telemetry

The system emits telemetry events:

- `[:alloy, :tool, :start]` - Tool execution started
- `[:alloy, :tool, :stop]` - Tool execution completed
- `[:alloy, :agent, :start]` - Agent started
- `[:alloy, :agent, :stop]` - Agent completed

## Configuration

Configuration is loaded via:
1. `mix.exs` - Project config
2. `config/config.exs` - Runtime config
3. Environment variables

See [CONFIG.md](config.md) for details.