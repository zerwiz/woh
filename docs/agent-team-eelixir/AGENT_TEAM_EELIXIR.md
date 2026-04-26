# Agent Team Implementation in Elixir

## Overview

This document describes how to implement the same agent team functionality found in the Pi reference system (`/home/zerwiz/woh/piwithstuff/extensions/agent-team.ts`) using Elixir and OTP primitives.

The Pi system uses a **dispatcher-only orchestrator** pattern where the primary agent delegates work to specialist agents via a `dispatch_agent` tool. Each specialist maintains its own Pi session for cross-invocation memory.

## Architecture Comparison

### Pi System (TypeScript)
```
┌─────────────────────────────────────────────┐
│  Primary Agent (Dispatcher)                 │
│  - NO codebase tools                        │
│  - ONLY delegates via dispatch_agent        │
│  - Loads agents from agents/*.md files      │
│  - Teams defined in .pi/agents/teams.yaml   │
└─────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────┐
│  Specialist Agents (via dispatch_agent)     │
│  - Each maintains own Pi session            │
│  - Project-local memory via .pi/agent-memory│
│  - Tools: read, grep, find, ls, [write, edit]│
└─────────────────────────────────────────────┘
```

### Elixir Implementation (OTP)
```
┌───────────────────────────────────────────────────┐
│  Supervisor: AlloyAgent.Server                     │
├───────────────────────────────────────────────────┤
│  - Processes: AlloyAgent.Dispatcher                │
│  - Children: AlloyAgent.Specialist (per agent)     │
│  - Supervision: OneForOne (fail fast)             │
├───────────────────────────────────────────────────┤
│  - Registry: :alloy_team                          │
│  - Sessions: AlloyAgent.Session (per agent)       │
│  - Memory: AlloyAgent.Memory.Disk or InMemory     │
└───────────────────────────────────────────────────┘
```

## Core Components to Implement

### 1. Agent Registry (`AlloyAgent.Registry`)

**Purpose:** Central repository for agent definitions and team membership

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Registry do
  @moduledoc """
  Central registry for agent definitions and team membership.
  Similar to Pi's `scanAgentDirs` + `teams.yaml` parsing.
  """
  
  # Agent definition structure matches TypeScript AgentDef
  defmodule AgentDef do
    defstruct [
      name: "",           # string - agent name
      description: "",    # string - agent description  
      tools: [],          # [string] - available tools
      system_prompt: "",  # string - system prompt
      file: nil,          # string - .md definition file path
      state: %{},         # map - runtime state
    ]
  end
  
  # Team structure matches TypeScript teams Record
  defmodule Team do
    defstruct [
      name: "",          # string - team name
      members: [],       # [string] - agent names
      created_at: nil,   # DateTime
    ]
  end
  
  # API surface
  def register_agent(pid, %AlloyAgent.AgentDef{}) do
    # Add to global registry
  end
  
  def activate_team(%{"team_name" => team_name}) do
    # Switch active team, similar to Pi's activateTeam()
  end
  
  def list_agents do
    # Returns all registered agents
  end
  
  def list_teams do
    # Returns all available teams
  end
end
```

**File Storage:**
```elixir
# ~/.pi/agents/teams.yaml (same as Pi)
# or .claude/agents/teams.yaml

all:
  - architect
  - builder
  - scanner
  - tester
```

### 2. Agent Definition Parsing (`AgentDefinition.Parse`)

**Pi Function:** `parseAgentFile(filePath)` - extracts frontmatter from .md files

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Definition.Parse do
  @moduledoc """
  Parse agent definition markdown files.
  
  Format:
  ---
  name: architect
  description: Handles architecture and design tasks
  tools: read, grep, find, ls, write, edit
  systemPrompt: |
    You are an architect agent. ...
  ---
  
  (content continues)
  """
  
  @doc """
  Parse frontmatter from agent definition file.
  
  ## Examples
  
      iex> parse("architect.md")
      %AlloyAgent.AgentDef{name: "architect", ...}
      
      iex> parse("unknown.md")
      {:error, "Invalid agent file format"}
  """
  def parse(file_path) do
    with {:ok, content} <- File.read(file_path),
         {:ok, frontmatter, body} <- parse_frontmatter(content) do
      %AlloyAgent.AgentDef{
        name: frontmatter.name || error("name required"),
        description: frontmatter.description || "",
        tools: string_to_list(frontmatter.tools || "read,grep,find,ls"),
        system_prompt: body,
        file: file_path,
        state: %{}
      }
    end
  rescue
    e -> {:error, e}
  end
  
  defp parse_frontmatter(content) do
    # Regex to match frontmatter
    case Regex.run(~r/^---\n(.+?)\n---\n(.+)$/, content) do
      [_, frontmatter_raw, body] ->
        # Parse key-value pairs from frontmatter
        {:ok, Map.new(
          frontmatter_raw
          |> String.split("\n")
          |> Enum.filter(&(&1 != ""))
          |> Enum.map(fn line ->
            case String.split(line, ": ", parts: 2) do
              [key, value] -> {String.trim(key), String.trim(value)}
              _ -> {line, ""}
            end
          end
        ), body: body}
      
      nil -> {:error, "Missing frontmatter delimiters"}
    end
  end
end
```

### 3. Agent State Management (`AlloyAgent.State`)

**Pi Structure:** `AgentState` with status, task, elapsed, tools, memory

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.State do
  @moduledoc """
  Runtime state for each agent, similar to TypeScript AgentState.
  
  Tracks:
  - status: idle | running | done | error
  - task: current task description
  - tools: currently active tools
  - elapsed: time since start
  - context usage
  """
  
  defstruct [
    agent: nil,              # AlloyAgent.AgentDef
    status: :idle,           # :idle | :running | :done | :error
    task: "",                # current task
    tools: %{},              # %{tool_name => %{started_at: t, end: t}}
    elapsed_ms: 0,           # milliseconds elapsed
    output: "",              # accumulated output
    thinking: "",            # thinking content
    context_used: 0,         # tokens used
    session_pid: nil,        # AlloyAgent.Session pid
  ]
  
  # Lifecycle operations
  def start_task(state, task) do
    %state__
    | task: task,
      status: :running,
      tools: %{},
      elapsed_ms: 0,
      output: "",
      thinking: ""
    |
  end
  
  def add_tool_usage(state, tool_name) do
    Map.update(state, :tools, %{tool_name => %{started_at: System.monotonic_time/1}}, 
      fn t -> Map.put(t, :started_at, System.monotonic_time/1) end
  )
  
  def finish_task(state, output) do
    %state__
    | status: :done,
      output: output,
      elapsed_ms: System.monotonic_time/1 - state.elapsed_ms,
    |
  end
  
  def error_state(state, error_message) do
    %state__
    | status: :error,
      output: error_message
    |
  end
end
```

### 4. Agent Session Management (`AlloyAgent.Session`)

**Pi Function:** Maintains per-agent `.json` session files for memory persistence

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Session do
  @moduledoc """
  Session management for agents, similar to Pi's session files.
  
  Each agent gets a dedicated AlloyAgent.Server process with its own memory store.
  """
  
  defstruct [
    agent: nil,              # AgentDef
    server_pid: nil,         # AlloyAgent.Server pid
    memory: nil,             # Alloy.Memory.t()
    created_at: nil,         # DateTime
  ]
  
  @doc """
  Create a new agent session with disk-backed memory (default for projects).
  
  ## Options
  
  - `:root` - Directory for memory storage (default: ~/.pi/agent-memory)
  - `:session_id` - Agent identifier (derived from name)
  """
  def new(agent_def, opts \\ []) do
    memory_opts = Keyword.merge(
      [
        root: Path.join(System.tmp_dir!(), "agent-memory"),
        session_id: String.downcase(agent_def.name |> String.replace(~r/\\s+/, "-"))
      ],
      opts
    )
    
    case AlloyAgent.Memory.Disk.new(memory_opts) do
      {:ok, memory_pid} ->
        {:ok, %__MODULE__{
          agent: agent_def,
          server_pid: AlloyAgent.start_link(%AlloyAgent.Config{memory: memory_pid}, agent: agent_def),
          memory: {AlloyAgent.Memory.Disk, memory_pid},
          created_at: DateTime.utc_now() |> DateTime.to_iso8601()
        }}
      
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  @doc """
  Create in-memory session (useful for testing).
  """
  def in_memory(agent_def) do
    {:ok, pid} = AlloyAgent.Memory.InMemory.start_link()
    {:ok, %__MODULE__{
      agent: agent_def,
      server_pid: AlloyAgent.start_link(%AlloyAgent.Config{memory: {AlloyAgent.Memory.InMemory, pid}}, agent: agent_def),
      memory: {AlloyAgent.Memory.InMemory, pid},
      created_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }}
  end
  
  @doc """
  Get session file path for memory persistence.
  """
  def file_path(session, agent_name) do
    Path.join(
      session.memory |> Keyword.get(:root, Path.join(System.home_dir!(), ".pi", "agent-memory")),
      "#{session.agent.name}.json"
    )
  end
end
```

### 5. Agent Memory System (`AlloyAgent.Memory`)

**Pi Function:** `resolveMemoryDir()`, `readMemoryIndex()`, `buildMemoryBlock()`

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Memory do
  @moduledoc """
  Memory store for agents, supporting both disk and in-memory backends.
  
  Implements the Alloy.Memory behaviour with callbacks:
  - init/2
  - get/2
  - put/2
  - delete/2
  - list/2
  """
  
  @behaviour Alloy.Memory
  
  defmodule Disk do
    @moduledoc """
    Filesystem-backed memory store. Persists across restarts.
    
    Similar to Pi's project-local memory via .pi/agent-memory directory.
    """
    
    defstruct [
      root: "",              # base directory
      session_id: "",        # session identifier
      storage_dir: nil,      # resolved storage path
    ]
    
    @doc """
    Create a new disk memory store.
    """
    def new(opts) do
      root = Keyword.get(opts, :root, Path.join(System.tmp_dir!(), "agent-memory"))
      session_id = Keyword.get(opts, :session_id, "unknown")
      storage_dir = Path.join(root, session_id)
      
      # Create directory if needed
      unless File.exists?(storage_dir) do
        File.mkdir_p!(storage_dir)
      end
      
      %__MODULE__{
        root: root,
        session_id: session_id,
        storage_dir: storage_dir
      }
    end
    
    @impl Alloy.Memory
    def init(store, _adapter_opts) do
      {:ok, store}
    end
    
    @impl Alloy.Memory
    def get(store, _key) do
      # TODO: Implement memory retrieval
      {:ok, ""}
    end
    
    @impl Alloy.Memory
    def put(store, key, value) do
      path = Path.join(store.storage_dir, key)
      File.write!(path, value)
      {:ok, value}
    end
    
    @impl Alloy.Memory
    def delete(store, key) do
      path = Path.join(store.storage_dir, key)
      if File.exists?(path) do
        File.rm!(path)
        {:ok, :deleted}
      else
        {:ok, :not_found}
      end
    end
    
    @impl Alloy.Memory
    def list(store) do
      store.storage_dir
      |> Path.wildcard("*")
      |> Enum.map(&Path.basename/1)
    end
  end
  
  defmodule InMemory do
    @moduledoc """
    In-memory memory store using ETS. Dies with the process.
    
    Similar to Pi's user-scoped memory in ~/.pi/agent-memory.
    """
    
    defstruct [
      ets_table: nil,
    ]
    
    @doc """
    Start a new in-memory store using ETS.
    """
    def start_link do
      name = ?MODULE
      ets_table = :ets.new(name, [:set, :named_table, :public])
      
      {:ok, %__MODULE__{ets_table: ets_table}}
    end
    
    @impl Alloy.Memory
    def init(store, _adapter_opts) do
      {:ok, store}
    end
    
    @impl Alloy.Memory
    def get(store, key) do
      case :ets.lookup(store.ets_table, key) do
        [{^key, value}] -> {:ok, value}
        [] -> {:error, :not_found}
      end
    end
    
    @impl Alloy.Memory
    def put(store, key, value) do
      :ets.insert(store.ets_table, {key, value})
      {:ok, value}
    end
    
    @impl Alloy.Memory
    def delete(store, key) do
      case :ets.delete(store.ets_table, key) do
        :deleted -> {:ok, :deleted}
        :missing -> {:ok, :not_found}
      end
    end
    
    @impl Alloy.Memory
    def list(store) do
      store.ets_table
      |> :ets.tab2list
      |> Enum.map(fn {key, _value} -> key end)
    end
  end
end
```

### 6. Team Management (`AlloyAgent.Team`)

**Pi Function:** `activateTeam()`, `switch_team`, `manage_team`

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Team do
  @moduledoc """
  Team management for organizing agents into groups.
  
  Similar to Pi's teams.yaml with /agents-team command for switching.
  """
  
  defstruct [
    name: "",                # team name
    members: [],             # [agent_name]
    active: false,           # is this the active team?
  ]
  
  @doc """
  Create a new team from YAML configuration.
  
  ## Examples
  
      iex> team = %AlloyAgent.Team{
      ...   name: "architectural",
      ...   members: ["architect", "designer"],
      ...   active: true
      ... }
      
      iex> Team.switch("architectural")
      {:ok, "architectural"}
  """
  def new(name, members \\ []) do
    %__MODULE__{
      name: name,
      members: members,
      active: false
    }
  end
  
  @doc """
  Switch to a different team.
  """
  def switch(new_team_name) do
    # Find new team and activate
    # Clear previous team state
    {:ok, new_team_name}
  end
  
  @doc """
  Add an agent to a team.
  """
  def add(%__MODULE__{} = team, agent_name) do
    if member?(team, agent_name) do
      {:error, :already_member}
    else
      %{team | members: [agent_name | team.members], active: true}
    end
  end
  
  @doc """
  Remove an agent from a team.
  """
  def remove(%__MODULE__{} = team, agent_name) do
    if !member?(team, agent_name) do
      {:error, :not_member}
    else
      %team | members: Enum.reject(team.members, &(&1 == agent_name)),
              active: false
    end
  end
  
  defp member?(team, agent_name) do
    agent_name in team.members
  end
end
```

### 7. Agent Dispatcher (`AlloyAgent.Dispatcher`)

**Pi Function:** `dispatchAgent()` - spawns new Pi instance per agent

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Dispatcher do
  @moduledoc """
  Dispatcher for agent tasks. Spawns new AlloyAgent.Server processes
  for each agent invocation, similar to Pi's per-agent sessions.
  """
  
  @moduledoc """
  Similar to Pi's dispatch_agent tool.
  
  ## Usage
  
      dispatcher = AlloyAgent.Dispatcher.new()
      result = AlloyAgent.Dispatcher.dispatch(dispatcher, %{"agent" => "architect", "task" => "..."})
  """
  
  defstruct [
    registry: nil,
    team: nil,
    session_dir: nil,       # ~/.pi/agent-sessions
  ]
  
  @doc """
  Create a new dispatcher.
  """
  def new(opts \\ []) do
    %__MODULE__{
      registry: AlloyAgent.Registry,
      team: Keyword.get(opts, :team, nil),
      session_dir: Keyword.get(opts, :session_dir, Path.join(System.tmp_dir!(), "agent-sessions"))
    }
  end
  
  @doc """
  Dispatch a task to an agent.
  
  ## Implementation Note
  
  Similar to Pi's dispatchAgent() which spawns "pi -e extensions/damage-control.ts"...
  
  In Elixir, we spawn AlloyAgent.Server directly.
  """
  def dispatch(dispatcher, %{"agent" => agent_name, "task" => task}) do
    case AlloyAgent.Registry.get_agent(agent_name) do
      {:ok, agent_def} ->
        with session <- AlloyAgent.Session.new(agent_def),
             _ = AlloyAgent.start_link(%AlloyAgent.Config{agent: agent_def, session: session}), do:
        send_task(%AlloyAgent.Server{session: session}, task)
      
      {:error, :not_found} ->
        {:error, "Agent #{agent_name} not found"}
    end
  end
  
  defp send_task(server, task) do
    # Use AlloyAgent.run/2 or Stream for streaming responses
    # The server processes the task and returns results
    AlloyAgent.run(task, provider: %AlloyAgent.Provider.OpenAI{...})
  end
end
```

### 8. Tool Registration (`AlloyAgent.Tools`)

**Pi Tools:** `switch_team`, `manage_team`, `dispatch_agent`

**Elixir Equivalent:**
```elixir
defmodule AlloyAgent.Tools do
  @moduledoc """
  Tool registration for agent team management.
  """
  
  # switch_team tool
  def switch_team_tool(ctx, params) do
    %AlloyAgent.Team{...} = AlloyAgent.Team.new(params["team_name"])
    AlloyAgent.Team.switch(params["team_name"])
  end
  
  # manage_team tool
  def manage_team_tool(ctx, params) do
    {action, agent_name} = {params["action"], params["agent"]}
    
    case AlloyAgent.Team.manage(action, agent_name) do
      {:ok, team} ->
        {:ok, "Updated team #{team.name}"}
      
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  # dispatch_agent tool
  def dispatch_agent_tool(ctx, params) do
    dispatcher = AlloyAgent.Dispatcher.new(team: ctx.active_team)
    dispatch(dispatcher, params)
  end
end
```

## Directory Structure

### Elixir Implementation Layout
```
.
├── lib/
│   ├── alloy_agent/
│   │   ├── registry.ex      # AgentRegistry
│   │   ├── definition/
│   │   │   └── parse.ex     # parseAgentFile equivalent
│   │   ├── state/           # AgentState
│   │   ├── session/         # AgentSession  
│   │   ├── memory/
│   │   │   ├── disk.ex      # Disk memory backend
│   │   │   └── in_memory.ex # In-memory ETS store
│   │   ├── team/            # Team management
│   │   ├── dispatcher/      # AgentDispatcher
│   │   ├── tools/
│   │   │   └── team_tools.ex # switch_team, manage_team
│   │   └── supervisor/      # AlloyAgent.Server
│   ├── alloy_agent.ex       # Main module
│   └── alloy_memory.ex      # Memory behaviour
├── mix.exs
└── priv/
    └── agents/              # Agent definition files
        └── teams.yaml
```

### Pi System Layout (Reference)
```
.
├── agents/                  # Agent definition .md files
├── .pi/
│   ├── agents/
│   │   └── teams.yaml      # Team configuration
│   ├── agent-memory/       # Memory storage
│   └── agent-sessions/     # Session files
└── extensions/
    └── agent-team.ts       # The TypeScript extension
```

## Migration Strategy

### Step 1: Add Dependencies
```elixir
# mix.exs
defp deps do
  [
    {:alloy, "~> 0.12"},
    {:alloy_agent, "~> 0.1"},  # New package for runtime concerns
    {:poison, "~> 5"},         # For YAML parsing (or use :yaml)
    {:ex_doc, "~> 0.29"}      # Documentation generation
  ]
end
```

### Step 2: Create Agent Definition Files
```
# .pi/agents/architect.md
---
name: architect
description: Handles architecture and design tasks
tools: read,grep,find,ls,write,edit
systemPrompt: |
  You are an architect agent. Your role is to design system architecture,
  choose appropriate technologies, and ensure code quality.
  
  You have access to file reading tools and can write/edit files.
  
  Your priorities:
  - System design
  - Code review
  - Documentation
  - Best practices
---

(architecture content continues)
```

### Step 3: Create Teams Configuration
```
# .pi/agents/teams.yaml
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

### Step 4: Initialize Team System
```elixir
# alloy_agent.ex
defmodule AlloyAgent do
  def start_link(opts) do
    Supervisor.start_link(
      [
        AlloyAgent.Registry.Supervisor,
        AlloyAgent.Memory.Supervisor,
        AlloyAgent.Team.Supervisor,
        AlloyAgent.Dispatcher
      ],
      name: :alloy_agent,
      opts
    )
  end
  
  def list_teams do
    AlloyAgent.Registry.list_teams()
  end
  
  def list_agents do
    AlloyAgent.Registry.list_agents()
  end
  
  def active_team do
    AlloyAgent.Registry.active_team()
  end
end
```

## Key Differences from Pi

### Pi System Uses
- `spawn` to create new Pi processes for each agent
- Session files in `.json` for memory persistence
- TUI rendering with `pi-tui`
- File-based state management

### Elixir Implementation Uses
- `Task.Supervisor` or direct `GenServer` spawning
- `AlloyAgent.Session` for memory management
- Stream-based responses with backpressure
- OTP supervision trees with `OneForOne` strategy
- Built-in process isolation per agent

### Benefits of Elixir Approach
- Better process isolation with OTP
- Automatic supervision and restart policies
- Stream-based response handling with proper backpressure
- Built-in fault tolerance
- ETS for fast in-memory lookups
- Type safety via modules and functions

## Testing Strategy

### Unit Tests for Agent Definition Parsing
```elixir
defmodule AlloyAgent.Definition.ParseTest do
  use ExUnit.Case, async: true
  
  test "parses architect.md" do
    assert parse("priv/agents/architect.md") == 
      %AlloyAgent.AgentDef{
        name: "architect",
        tools: ["read", "grep", "find", "ls", "write", "edit"]
      }
  end
  
  test "handles missing name" do
    assert parse("invalid.md") == {:error, "name required"}
  end
end
```

### Integration Tests for Team Switching
```elixir
defmodule AlloyAgent.TeamIntegrationTest do
  use ExUnit.Case, async: true
  
  setup do
    {:ok, _pid} = AlloyAgent.start_link([])
  end
  
  test "switch team and dispatch" do
    team_name = "architectural"
    result = AlloyAgent.Tools.switch_team(tool_id, %{"team_name" => team_name})
    
    assert result.exit_code == 0
    assert AlloyAgent.active_team() == team_name
  end
end
```

## Error Handling

### Similar to Pi's Error Cases
```elixir
# Pi: Agent not found
# Elixir: Agent not found

defmodule AlloyAgent.Dispatcher do
  def dispatch(dispatcher, params) when is_binary(params["agent"]) do
    case Registry.lookup(:agents, params["agent"]) do
      [agent_pid] -> Task.async(&handle_dispatch/1, agent_pid, params)
      [] -> {:error, "Agent #{params["agent"]} not found"}
    end
  end
end
```

## Next Steps

1. **Implement AlloyAgent.Memory module** - Start with in-memory ETS, then add disk backend
2. **Create agent definition parser** - Parse frontmatter from .md files
3. **Build team management** - Implement switch, add, remove operations
4. **Set up supervisor tree** - Create proper supervision strategy
5. **Implement dispatch logic** - Spawn agents with proper isolation
6. **Add streaming responses** - Use Stream for real-time updates
7. **Create TUI integration** - Build LiveView or terminal UI for status

## Questions Worth Asking

- **Do you need full TUI rendering?** Pi uses `pi-tui` which provides visual dashboards. Elixir alternatives: LiveView, Terminal UI, or simple status updates via `Task.async`.
- **Should agents persist across restarts?** Pi uses session files. Elixir can use ETS (in-memory) or file-based stores via `AlloyAgent.Memory.Disk`.
- **Do you need streaming responses?** Pi streams via `message_update` events. Elixir can stream using `GenServer.cast` + `Task.async` + backpressure.
- **Should tools be file-based or in-memory?** Pi uses session files. Elixir can cache in memory or use `Alloy.Memory` for persistence.

## Reference Documentation

- Pi system: `/home/zerwiz/woh/piwithstuff/extensions/agent-team.ts`
- Existing migration guide: `/home/zerwiz/woh/docs/MIGRATION-alloy_agent.md`
- Alloy protocol: See Alloy GitHub repo for base protocol modules

## Contributing

This document is a work in progress. Please update it as you implement the agent team functionality in Elixir.