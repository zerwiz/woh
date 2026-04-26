# Agent Team Implementation Status

## Overview

This document tracks the implementation status of the agent team functionality for the Elixir base system (`woh`), designed to provide the same capabilities as the Pi system's `agent-team.ts` extension.

**Goal**: When the user types `woh` in the terminal, the agent team system should boot up automatically, allowing them to use specialist agents just like `pi`.

---

## What Has Been Implemented

### 1. Core Data Structures

- **[`AlloyAgent.AgentDef`](/home/zerwiz/woh/lib/alloy_agent/agent_def.ex)** - Agent definition struct with name, description, tools, system prompt, and file path
- **[`AlloyAgent.Team`](/home/zerwiz/woh/lib/alloy_agent/team.ex)** - Team struct for organizing agents into groups with add/remove/switch functionality
- **[`AlloyAgent.Registry`](/home/zerwiz/woh/lib/alloy_agent/registry.ex)** - Central registry for agent definitions and team membership

### 2. File System Setup

- Created `/home/zerwiz/woh/lib/alloy_agent/` directory
- All agent modules are now accessible and follow OTP conventions
- Registry includes YAML parsing for `teams.yaml` configuration

### 3. Documentation

- **[`README.md`](/home/zerwiz/woh/docs/agent-team-eelixir/README.md)** - High-level overview and quick start guide
- **[`AGENT_TEAM_EELIXIR.md`](/home/zerwiz/woh/docs/agent-team-eelixir/AGENT_TEAM_EELIXIR.md)** - Complete implementation guide with full code examples
- **This document** - Implementation status tracking

### 4. Integration with Application

- Updated [`Alloy.Application`](/home/zerwiz/woh/lib/alloy/application.ex) with documentation for agent team configuration
- Added `start_with_agent_team/2` function (documentation only)
- Agent team initialization hooks defined in application supervision

---

## What Still Needs to Be Implemented

### Priority 1: Core Agent Modules (Blocking)

#### 1.1 Agent State Management

- **Module**: `AlloyAgent.State`
- **Purpose**: Track agent runtime state (status, task, tools, elapsed time, output)
- **Key Functions**:
  - `start_task/2` - Begin a new task
  - `add_tool_usage/2` - Record tool execution
  - `finish_task/2` - Complete task with output
  - `error_state/2` - Handle errors
- **Status**: ❌ TODO

#### 1.2 Agent Session Management

- **Module**: `AlloyAgent.Session`
- **Purpose**: Per-agent session for cross-invocation memory
- **Key Functions**:
  - `new/2` - Create new agent session
  - `in_memory/1` - Create in-memory session for testing
  - `file_path/2` - Get session file path
- **Status**: ❌ TODO

#### 1.3 Agent Memory System

- **Module**: `AlloyAgent.Memory`
- **Purpose**: Memory store for agents (disk or in-memory)
- **Key Functions**:
  - `Disk.new/1` - Create disk-backed memory
  - `InMemory.start_link/0` - Create in-memory ETS store
  - Implement `Alloy.Memory` behaviour callbacks
- **Status**: ❌ TODO

#### 1.4 Agent Dispatcher

- **Module**: `AlloyAgent.Dispatcher`
- **Purpose**: Spawn agents and handle task dispatching
- **Key Functions**:
  - `new/1` - Create dispatcher
  - `dispatch/2` - Dispatch task to agent
- **Status**: ❌ TODO

#### 1.5 Agent Definition Parser

- **Module**: `AlloyAgent.Definition.Parse`
- **Purpose**: Parse agent `.md` files (frontmatter extraction)
- **Key Functions**:
  - `parse/1` - Parse single agent file
  - `parse_frontmatter/1` - Extract frontmatter from content
- **Status**: ❌ TODO (documentation only in `AGENT_TEAM_EELIXIR.md`)

### Priority 2: Supervisor and Lifecycle (Critical)

#### 2.1 Application Supervision

- **Module**: `AlloyAgent.Supervisor`
- **Purpose**: Start all agent components on `woh` launch
- **Key Functions**:
  - `start_link/1` - Start supervisor tree
  - Spawn Registry, Memory, Team, Dispatcher children
- **Status**: ❌ TODO

#### 2.2 Tool Registration

- **Module**: `AlloyAgent.Tools`
- **Purpose**: Register team management tools
- **Key Functions**:
  - `switch_team_tool/2` - Switch active team
  - `manage_team_tool/2` - Add/remove agents
  - `dispatch_agent_tool/2` - Dispatch to specialist
- **Status**: ❌ TODO

### Priority 3: TUI and UX (Nice-to-have)

#### 3.1 Terminal Status Widget

- **Purpose**: Show active team, running agents, tool usage
- **Status**: ❌ TODO (Pi uses `pi-tui`, Elixir alternatives: LiveView, simple console output)

#### 3.2 Agent Listing Commands

- **Module**: `AlloyAgent.Commands`
- **Purpose**: Provide `/agents-list`, `/agents-team`, `/agents-reload`
- **Status**: ❌ TODO

#### 3.3 Streaming Responses

- **Purpose**: Stream agent responses like Pi's `message_update` events
- **Status**: ❌ TODO (use `Stream` with backpressure)

### Priority 4: Configuration Files (User Setup)

#### 4.1 Teams Configuration

- **File**: `~/.pi/agents/teams.yaml`
- **Purpose**: Define available teams and their members
- **Status**: ⚠️ USER ACTION REQUIRED

Example format:
```yaml
all:
  - architect
  - builder
  - scanner
  - tester

architectural:
  - architect
  - reviewer

implementation:
  - builder
  - scanner

quality:
  - tester
  - architect
```

#### 4.2 Agent Definition Files

- **Location**: `~/.pi/agents/*.md`
- **Purpose**: Define individual specialist agents
- **Status**: ⚠️ USER ACTION REQUIRED

Example format:
```markdown
---
name: architect
description: Handles architecture and design tasks
tools: read,grep,find,ls,write,edit
systemPrompt: |
  You are an architect agent. Your role is to design system architecture...
---

(architecture content continues)
```

---

## Implementation Path

### Step 1: Create Core Modules (Today)

1. Implement `AlloyAgent.State` - Agent runtime state
2. Implement `AlloyAgent.Session` - Per-agent sessions
3. Implement `AlloyAgent.Memory` - Disk/ETs memory stores
4. Implement `AlloyAgent.Dispatcher` - Task dispatching
5. Implement `AlloyAgent.Definition.Parse` - Frontmatter parsing

### Step 2: Add Tool Registration (Tomorrow)

1. Implement `AlloyAgent.Tools` - Tool handlers
2. Add tool registration to main application
3. Wire up team switching and agent dispatching

### Step 3: Wire Up Application (Same Day)

1. Update `Alloy.Application` to start agent components
2. Create supervisor tree for agents
3. Add configuration hooks

### Step 4: Test With Sample Agents (Next Day)

1. Create sample agent definitions
2. Create sample teams.yaml
3. Test `mix run alloy` boots up agents
4. Test `/agents-list` and team switching

### Step 5: TUI Integration (Future Iteration)

1. Add terminal status output
2. Add agent listing widgets
3. Add streaming response handling

---

## What's Working Now

✅ Core data structures (AgentDef, Team, Registry)  
✅ Documentation for all components  
✅ Application integration hooks  
✅ File directory structure  
✅ YAML parsing for teams.yaml  
✅ OTP-compliant module design  

---

## What's Missing

❌ Agent state management  
❌ Session management  
❌ Memory stores  
❌ Agent dispatcher  
❌ Definition parser  
❌ Supervisor tree  
❌ Tool registration  
❌ TUI widgets  
❌ Streaming responses  
❌ Command handlers  

---

## Quick Wins (Fastest Path to Working)

### 1. Minimal Memory Implementation (30 minutes)

```elixir
defmodule AlloyAgent.Memory.InMemory do
  def start_link do
    {:ok, pid} = :ets.new(__MODULE__, [:set, :named_table, :public])
    {:ok, pid}
  end
  
  # Implement Alloy.Memory behaviour
end
```

### 2. Minimal State Management (15 minutes)

```elixir
defmodule AlloyAgent.State do
  defstruct [:agent, :status, :task, :tools, :elapsed_ms, :output]
  
  def start_task(state, task) do
    # Return new state with running status
  end
end
```

### 3. Minimal Parser (10 minutes)

```elixir
defmodule AlloyAgent.Definition.Parse do
  def parse(path) do
    # Simple frontmatter regex parsing
  end
end
```

### 4. Wire It Up (5 minutes)

Add to `mix.exs` deps:
```elixir
defp deps do
  [
    {:alloy, "~> 0.12"},
    {:alloy_agent, path: "./lib/alloy_agent"}
  ]
end
```

Add to `Alloy.Application.start/2`:
```elixir
def start(_type, _args) do
  # Start Alloy first
  Supervisor.start_link(children, strategy: :one_for_one, name: Alloy.Supervisor)
  
  # Then start agents
  AlloyAgent.Registry.initialize([])
  AlloyAgent.Memory.Supervisor.start_link()
  AlloyAgent.Team.Supervisor.start_link()
end
```

---

## Questions Worth Asking

1. **Do you need full TUI rendering?** 
   - Consider LiveView or simple console output first
   - Pi uses `pi-tui`, but Elixir has other options

2. **Should agents persist across restarts?**
   - Use `AlloyAgent.Memory.Disk` for persistence
   - Or ETS (in-memory, faster but lost on restart)

3. **Do you need streaming responses?**
   - Use `Stream` with backpressure handling
   - Or simple async responses

4. **What tool priority?**
   - File-based (like Pi) or in-memory caching?
   - Start with in-memory, add disk later

---

## Next Steps (Recommended Order)

1. **Today**: Implement core modules (State, Session, Memory, Parser)
2. **Tomorrow**: Wire up supervisor and tools
3. **Day 3**: Test with sample agents
4. **Day 4**: Add TUI integration
5. **Day 5**: Polish and document final API

---

## Reference

- **Pi System**: `/home/zerwiz/woh/piwithstuff/extensions/agent-team.ts`
- **Existing Migration**: `/home/zerwiz/woh/docs/MIGRATION-alloy_agent.md`
- **Alloy Protocol**: See Alloy GitHub repo for base protocol modules

---

## Contributing

This document is a work in progress. Update it as you implement each component.

**Status last updated**: When you read this
**Next update**: After implementing next priority item