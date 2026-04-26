# Agent Team Implementation in Elixir

This documentation explains how to implement the Pi agent team functionality in Elixir using OTP primitives.

## Overview

The alloy_agent system uses a **dispatcher-only orchestrator** pattern where the primary agent delegates work to specialist agents. This pattern maximizes parallelism while maintaining clear separation of concerns.

## Architecture Comparison

| Component | Pi (TypeScript) | Elixir (OTP) |
|-----------|-----------------|---------------|
| Dispatcher | Primary Pi agent | `AlloyAgent.Server` |
| Specialists | Per-agent Pi session | `AlloyAgent.Server` per agent |
| Memory | `.json` session files | `AlloyAgent.Memory` (ETs/Disk) |
| Teams | `teams.yaml` + commands | `AlloyAgent.Team` + supervision |
| State | In-memory Map | GenServer state |
| Isolation | Separate processes | OTP process isolation |

## Directory Structure

```
lib/
├── alloy_agent/
│   ├── agent_def.ex                    # Core API
│   ├── agent_definition.ex             # API with definitions
│   ├── agent.ex                        # Agent operations
│   ├── application.ex                  # Application supervision tree
│   ├── definition/
│   │   └── ex                           # Definition parsing
│   ├── dispatcher.ex                   # Task dispatching
│   ├── memory/
│   │   └── ex                          # Memory management
│   ├── registry.ex                     # Agent registry
│   ├── session.ex                      # Session handling
│   ├── state.ex                        # State management
│   ├── supervisor.ex                   # Process supervision
│   ├── team.ex                         # Team coordination
│   ├── definition/                     # Agent definition parsing
│   │   ├── ex                         # Parsing logic
│   │   ├── agent_def.ex              # Definition struct
│   │   └── agent_definition.ex       # Definition API
│   └── tools/                          # Tool registry
│       └── ex
```

## Core Module Functions

### Memory Operations

```elixir
AlloyAgent.Memory.get(module, key)
AlloyAgent.Memory.put(module, key, value)
AlloyAgent.Memory.delete(module, key)
```

### Session Operations

```elixir
AlloyAgent.Session.new(session_opts)
AlloyAgent.Session.get(session)
```

### Tool Operations

```elixir
AlloyAgent.tool_category(tool)
AlloyAgent.tool_description(tool)
AlloyAgent.tool_info(tool)
```

### Agent Operations

```elixir
AlloyAgent.agent_info(agent_name)
AlloyAgent.agent_tools(agent_name)
AlloyAgent.agent_description(agent_name)
AlloyAgent.agent_role(agent_name)
```

### Memory Implementation

```elixir
defmodule AlloyAgent.Memory do
  use GenServer

  @typedoc "Memory key for agent"
  @type key :: String.t()

  alias AlloyAgent.State

  @typedoc "Memory store state"
  defstruct [:memory]

  @typedoc "Memory configuration"
  defstruct [
    :module,      # Memory module name
    :key,         # Key for agent
    :storage,     # Storage type (:ets | :disk)
    :root_path    # Root path for disk storage
  ]

  @impl GenServer
  def init(opts) do
    case Keyword.pop(opts, :storage, :ets) do
      {:ets, _} ->
        :ets.new(:memory_store, [:set, :named_table, :public])
        |> case do
          ets ->
            GenServer.call(__MODULE__, :new, 5000)
            |> case do
              :ok ->
                {:ok, %__MODULE__{}, ets}
                |> then(fn {_, state, ets} ->
                  {:ok, state}
                end)

            nil ->
              {:stop, :normal, %__MODULE__{}}
              |> then(fn -> {:stop, :normal, %__MODULE__{}} end)
        end

      {:disk, root_path} ->
        :tmp = Application.get-env(:alloy_agent, :root_path)
        case Path.join(root_path || ".", :tmp, :memory) do
          path ->
            :ok = File.mkdir_p!(path)
            File.touch(path)
        end
        {:ok, GenServer.start_link(__MODULE__, %{}, name: opts[:name])}
    end
  end
end
```

### Agent Definition API

```elixir
defmodule AlloyAgent.AgentDefinition do
  @moduledoc """
  Agent definition module for parsing agent definitions.

  Handles frontmatter extraction and struct creation.
  """

  defmodule T do
    @type t :: %AlloyAgent.AgentDefinition.T{

      @doc "Name of the agent"
      name: String.t() || nil,

      @doc "Description of the agent"
      description: String.t() || nil,

      @doc "List of tools used by the agent"
      tools: list(String.t()) || [],

      @doc "System prompt for the agent"
      system_prompt: String.t() || "",

      @doc "Team this agent belongs to"
      team: String.t() || "all",

      @doc "Full content without frontmatter"
      value: String.t() || "",

      @doc "Parse metadata for the agent"
      metadata: map() || %{},

      @doc "Path to agent file"
      file_path: Path.t() || nil
    }

    defstruct [:name, :description, :tools, :system_prompt, :file_path,
               :team, :metadata, :value]
  end

  @impl true
  def new(opts) do
    name = Keyword.get(opts, :name)
    description = Keyword.get(opts, :description, "")
    tools = Keyword.get(opts, :tools, [])
    system_prompt = Keyword.get(opts, :system_prompt, "")
    file_path = Keyword.get(opts, :file_path, nil)
    team = Keyword.get(opts, :team, "all")

    %T{
      name: name || "unknown",
      description: description,
      tools: tools,
      system_prompt: system_prompt,
      file_path: file_path,
      team: team
    }
  end

  @doc "Creates a new agent with name, description, and tools"
  def create(name, description, tools \\ []) do
    %T{
      name: name,
      description: description,
      tools: tools
    }
  end

  @doc "Validates an agent definition"
  def validate(definition) do
    required = [:name]
    missing = required |> Enum.map(&definition.__struct__[&1]) |> Enum.reject(&is_nil/1)

    Enum.empty?(missing)
  end
end
```

### Team Coordinator

```elixir
defmodule Team do
  @moduledoc """
  Team coordination module for the Pi agent team.

  Manages team membership, operations, and synchronization.
  """

  defmodule T do
    @type t :: %Team.T{
      @doc "Name of the team"
      name: String.t(),

      @doc "List of team members"
      members: list(String.t()),

      @doc "Team operations"
      ops: map(),

      @doc "Team session"
      session: AlloyAgent.T(),

      @doc "Team created at"
      created_at: NaiveDateTime.t()
    }

    defstruct [:name, :members, :ops, :session, :created_at]
  end

  @doc "Creates a new team"
  def create(name, members) do
    %T{
      name: name,
      members: members || [],
      ops: %{},
      session: nil,
      created_at: NaiveDateTime.utc_now()
    }
  end

  @doc "Gets team members"
  def get_members(team) do
    team.members
  end

  @doc "Adds a member to the team"
  def add_member(team, member) do
    Map.put(team, :members, team.members ++ [member])
  end

  @doc "Removes a member from the team"
  def remove_member(team, member) do
    team.members -- [member]
    |> then(fn members ->
      Map.put(team, :members, members)
    end)
  end

  @doc "Gets team info"
  def info(team) do
    %{
      name: team.name,
      members: team.members,
      created_at: team.created_at
    }
  end
end
```

### Supervisor Tree

```elixir
defmodule AlloyAgent.Supervisor do
  @moduledoc """
  Agent team supervisor for process supervision tree.

  Uses OTP supervisor primitives for process management.
  """

  use Supervisor

  def start_link(args) do
    Supervisor.start_link(__MODULE__, args, name: __MODULE__)
  end

  def init(opts) do
    children = [
      AlloyAgent.Memory,
      AlloyAgent.Session,
      AlloyAgent.Registry,
      Agent(
        name: "architect",
        definition: AlloyAgent.Definition.lookup("architect"),
        tools: AlloyAgent.Tools.list_tool()
      ),
      AlloyAgent.Supervisor,
      AlloyAgent.Team
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  @doc "Starts an agent process"
  def start_agent(name, opts \\ []) do
    child =
      case Registry.lookup(name) do
        {:ok, def} ->
          child_spec(
            Agent(
              name: name,
              definition: def,
              tools: Keyword.get(opts, :tools, def.tools)
            )
          )

        _ ->
          nil
      end

    if child do
      Supervisor.start_child(AlloyAgent.Supervisor, child)
    end
  end

  @doc "Starts a team"
  def spawn_team(team) do
    Supervisor.start_child(AlloyAgent.Supervisor, child_spec(team))
  end

  @doc "Gets team info"
  def info(team) do
    case Supervisor.child_spec(team, []) do
      child ->
        child

      nil ->
        {:ok, %Team{}}
    end
  end

  defdelegate get(), to: &get/0

  @doc "Gets team members"
  def get_team_members(team) do
    case Registry.get_team_members(team) do
      members ->
        members
    end
  end
end
```

## Agent Team Operations

### Core Agent Functions

```elixir
defmodule AlloyAgent.Core do
  @moduledoc """
  Core agent functions for the Pi agent team.

  Provides orchestration, memory, and state management.
  """

  defmodule T do
    @type t :: struct()

    defstruct [:agents, :memory, :teams, :tools]
  end

  @doc "Gets agent info"
  def agent(name) do
    case Registry.lookup(name) do
      {:ok, def} ->
        %{
          name: def.name,
          description: def.description,
          tools: def.tools,
          system_prompt: def.system_prompt,
          team: def.team
        }

      _ ->
        nil
    end
  end

  @doc "Gets agent description"
  def description(agent) do
    agent.__struct__[[:description]]
  end

  @doc "Gets agent tools"
  def tools(agent) do
    agent.__struct__[[:tools]]
  end

  @doc "Gets agent memory"
  def get_memory(agent) do
    Memory.get(agent, :memory)
  end

  @doc "Puts memory for agent"
  def put_memory(agent, key, value) do
    Memory.put(agent, key, value)
  end

  @doc "Gets agent state"
  def state(agent) do
    State.new(agent)
  end

  @doc "Gets agent session"
  def session(agent) do
    Session.get(agent)
  end

  @doc "Creates a new agent session"
  def new_session(agent) do
    Session.new(agent)
  end

  @doc "Gets team info"
  def team(team) do
    case Registry.lookup_team(team) do
      {:ok, team_info} ->
        team_info

      nil ->
        Team.create(team, [])
    end
  end

  @doc "Gets tool info"
  def tool(tool) do
    case Registry.lookup(tool) do
      {:ok, info} ->
        info

      _ ->
        nil
    end
  end

  @doc "Gets memory info"
  def memory_info(key) do
    case Memory.get(key) do
      {:ok, value} ->
        value

      _ ->
        nil
    end
  end
end
```

## Implementation Roadmap

### Phase 1: Core Implementation

1. Implement `AlloyAgent.Memory` (GenServer for in-memory storage)
2. Implement `AlloyAgent.Session` (Session tracking)
3. Implement `AlloyAgent.Registry` (Agent registry)
4. Implement `AlloyAgent.Definition` (Definition parsing)
5. Implement `AlloyAgent.Team` (Team coordination)
6. Implement `AlloyAgent.Superisor` (Process supervision)

### Phase 2: Agent Implementation

1. Implement `architect` agent (core orchestration)
2. Implement `builder` agent (write tool)
3. Implement `scanner` agent (read/ls/find/grep/bash)
4. Implement `tester` agent (bash/read)

### Phase 3: Tool Implementation

1. Implement filesystem tools (read, write, ls, find, grep, edit)
2. Implement bash tool
3. Implement tool registry

### Phase 4: Team Implementation

1. Coordinate agent teams
2. Implement team operations
3. Implement team sessions

## Example Usage

```elixir
# Start the AlloyAgent application
AlloyAgent.Application.start(
  name: AlloyAgent,
  agents: ["architect", "builder", "scanner", "tester"],
  team: "all"
)

# Create a team
team = Team.create("all", ["architect", "builder", "scanner", "tester"])

# Start agents
AlloyAgent.Supervisor.start_agent("architect", agent_opts: [])
AlloyAgent.Supervisor.start_agent("builder", agent_opts: [])
AlloyAgent.Supervisor.start_agent("scanner", agent_opts: [])
AlloyAgent.Supervisor.start_agent("tester", agent_opts: [])

# Get agent info
agent = AlloyAgent.Core.agent("architect")
```

## Notes

- Use `@moduledoc` for module documentation
- Use `defimpl` for protocol implementations
- Use `GenServer` for state management
- Use `Supervisor` for process tree management
- Use ETs or disk for memory storage
- Follow OTP conventions for naming and structuring

## See Also

- https://hexdocs.pm/erlware_plist
- https://hexdocs.pm/erlware_plug
- https://hexdocs.pm/erlware_phoenix
- https://hexdocs.pm/erlware_plug

---
Generated by AlloyAgent team
*/