# Alloy Agent - Module Reference

Complete API reference for all Alloy Agent modules.

## Core Modules

### AlloyAgent.Agent

Core agent operations module. Provides agent info, memory, state, session management.

```elixir
# Get agent info
AlloyAgent.Agent.agent("architect")
# %{name: "architect", description: "...", tools: [...], ...}

# Get agent description
AlloyAgent.Agent.description("builder")

# Get agent tools
AlloyAgent.Agent.tools("scanner")
# ["read", "ls", "find", "grep", "bash"]

# Get/set memory
AlloyAgent.Agent.get_memory("architect")
AlloyAgent.Agent.put_memory("architect", :key, value)

# Get/create state
AlloyAgent.Agent.state("builder")
AlloyAgent.Agent.new_session("architect")

# Get/create session
AlloyAgent.Agent.session("tester")
```

### AlloyAgent.Core

Provides orchestration, memory, state, and session management for PI agent team.

```elixir
AlloyAgent.Core.agent(name)
AlloyAgent.Core.description(agent)
AlloyAgent.Core.tools(agent)
AlloyAgent.Core.get_memory(agent)
AlloyAgent.Core.put_memory(agent, key, value)
AlloyAgent.Core.state(agent)
AlloyAgent.Core.session(agent)
AlloyAgent.Core.new_session(agent, max_turns: 10)
AlloyAgent.Core.team(team_name)
AlloyAgent.Core.tool(tool_name)
AlloyAgent.Core.memory_info(key)
AlloyAgent.Core.parse_agent_text(text)
AlloyAgent.Core.parse_agent_file(file_path)
```

### AlloyAgent.State

Agent runtime state management. Tracks agent lifecycle.

```elixir
# Create new state
state = AlloyAgent.State.new("architect")
# %AlloyAgent.State.T{agent: "architect", status: :idle, ...}

# State transitions
AlloyAgent.State.start_task(state, task, opts)
AlloyAgent.State.record_tool(state, tool_id, opts)
AlloyAgent.State.next_turn(state, opts)
AlloyAgent.State.finish(state, output)
AlloyAgent.State.error(state, error_msg)
AlloyAgent.State.abort(state)

# Field getters
AlloyAgent.State.agent(state)
AlloyAgent.State.status(state)
AlloyAgent.State.task(state)
AlloyAgent.State.tools(state)
AlloyAgent.State.elapsed_ms(state)
AlloyAgent.State.output(state)
AlloyAgent.State.turn(state)
AlloyAgent.State.max_turns(state)
```

### AlloyAgent.Session

Session tracking module.

```elixir
# Create session
session = AlloyAgent.Session.new(agent: "builder", max_turns: 25)

# Session operations
AlloyAgent.Session.output(session)
AlloyAgent.Session.status(session)
AlloyAgent.Session.task(session)
AlloyAgent.Session.append_output(session, output_text)
AlloyAgent.Session.advance_turn(session)
AlloyAgent.Session.record_tool_usage(session, "read")
AlloyAgent.Session.finish(session, output)
AlloyAgent.Session.error(session, error_msg)
AlloyAgent.Session.abort(session)
```

### AlloyAgent.Memory

Memory store supporting both in-memory (ETS) and disk-backed storage.

```elixir
# Create memory store
{:ok, mem} = AlloyAgent.Memory.new(:memory)
{:ok, mem} = AlloyAgent.Memory.new(:disk, "/tmp/agents/memory")

# Memory operations
AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
AlloyAgent.Memory.get(mem, "agent-1")
AlloyAgent.Memory.delete(mem, "agent-1")
AlloyAgent.Memory.clear(mem)
AlloyAgent.Memory.has?(mem, "agent-1")
AlloyAgent.Memory.keys(mem)
AlloyAgent.Memory.each(mem, callback)
```

### AlloyAgent.Definition

Agent definition parsing from markdown frontmatter.

```elixir
# Parse from text
def = AlloyAgent.Definition.parse_agent_text(markdown_text)

# Parse from file
def = AlloyAgent.Definition.parse_agent_file("/path/to/agent.md")

# Definition struct
# %AlloyAgent.Definition.T{
#   name: String.t(),
#   description: String.t(),
#   tools: [String.t()],
#   system_prompt: String.t(),
#   value: String.t(),
#   metadata: map(),
#   file_path: Path.t()
# }
```

### AlloyAgent.AgentDef

Core agent definition with tools and skills.

```elixir
# Create agent definition
agent = AlloyAgent.AgentDef.create(
  "researcher",
  "Research specialist",
  "research",
  tools: ["read", "grep"],
  skills: ["analyze", "deduce"],
  priority: 0.8
)

# Agent operations
AlloyAgent.AgentDef.name(agent)
AlloyAgent.AgentDef.description(agent)
AlloyAgent.AgentDef.team(agent)
AlloyAgent.AgentDef.tools(agent)
AlloyAgent.AgentDef.skills(agent)
AlloyAgent.AgentDef.priority(agent)
AlloyAgent.AgentDef.capabilities(agent)

# Enable/disable capabilities
AlloyAgent.AgentDef.enable_tools(agent)
AlloyAgent.AgentDef.disable_tools(agent)
AlloyAgent.AgentDef.enable_skills(agent)
AlloyAgent.AgentDef.disable_skills(agent)
AlloyAgent.AgentDef.set_priority(agent, 0.9)
```

### AlloyAgent.AgentDefinition

Full definition API with lookup and management.

```elixir
# Create definition
AlloyAgent.AgentDefinition.new(name: "architect", tools: ["bash"])

# Lookup
AlloyAgent.AgentDefinition.get("architect")
AlloyAgent.AgentDefinition.get_by_path("path/to/file.md")
AlloyAgent.AgentDefinition.get_by_team("all")

# Lists
AlloyAgent.AgentDefinition.get_all()
AlloyAgent.AgentDefinition.count()
AlloyAgent.AgentDefinition.default_agents()
AlloyAgent.AgentDefinition.default_tools()
AlloyAgent.AgentDefinition.all_tools()
AlloyAgent.AgentDefinition.all_types()

# Utilities
AlloyAgent.AgentDefinition.default()
AlloyAgent.AgentDefinition.default_team()
AlloyAgent.AgentDefinition.has_definition("architect")
AlloyAgent.AgentDefinition.get_by_type("core_agent")
AlloyAgent.AgentDefinition.type("architect")
AlloyAgent.AgentDefinition.get_agent_tools("scanner")
AlloyAgent.AgentDefinition.get_agent_description("builder")
```

### AlloyAgent.Registry

Central registry for agent definitions and tools.

```elixir
# Lookup
AlloyAgent.Registry.agent("architect")
AlloyAgent.Registry.tool("read")

# Lists
AlloyAgent.Registry.agent_names()
AlloyAgent.Registry.all_tools()
AlloyAgent.Registry.tool_categories()
AlloyAgent.Registry.default_agents()
AlloyAgent.Registry.all_tools_list()
```

### AlloyAgent.Dispatcher

Task dispatching to agents with concurrent execution.

```elixir
# Create dispatcher
dispatcher = AlloyAgent.Dispatcher.new(agent, max_concurrent: 4)

# Dispatch task
AlloyAgent.Dispatcher.dispatch(dispatcher, %{tool: "bash", command: "ls -la"})

# Execute task
AlloyAgent.Dispatcher.execute_task(dispatcher, task, timeout: 60_000)

# Tool operations
AlloyAgent.Dispatcher.invoke_tool(agent, "bash", %{command: "ls"}, 60_000)
AlloyAgent.Dispatcher.run_tool(agent, "read", %{path: "file.txt"})
AlloyAgent.Dispatcher.run_tool_directly(agent, "bash", %{command: "ls -la"})

# File operations
AlloyAgent.Dispatcher.write(path, content)
AlloyAgent.Dispatcher.read(path)
AlloyAgent.Dispatcher.edit(path, content)
```

### AlloyAgent.Tools

Tool execution for file operations and bash.

```elixir
# File operations
AlloyAgent.Tools.read("file.txt", limit: 100)
AlloyAgent.Tools.write("path/to/file.txt", "content", mode: 0o644)
AlloyAgent.Tools.edit("file.txt", "old", "new")
AlloyAgent.Tools.delete("file.txt")

# Search
AlloyAgent.Tools.search(pattern: "*.ex")
AlloyAgent.Tools.find(name: "config.ex")

# System
AlloyAgent.Tools.bash("ls -la", timeout: 30)

# Storage
AlloyAgent.Tools.put("file.txt", content, agent: "builder")

# Utilities
AlloyAgent.Tools.list_tools()
AlloyAgent.Tools.get_tool_info("read")
AlloyAgent.Tools.move(source, destination)
AlloyAgent.Tools.copy(source, destination)
AlloyAgent.Tools.metadata(path)
AlloyAgent.Tools.mkdir(path)
```

### AlloyAgent.Supervisor

Team supervisor for crash recovery and process management.

```elixir
# Create supervisor
supervisor = AlloyAgent.Supervisor.new(name: "architect", team: "all")

# Start
AlloyAgent.Supervisor.start_link(agent: "architect", team: "all")

# Operations
AlloyAgent.Supervisor.start(agent, options)
AlloyAgent.Supervisor.stop(agent)
AlloyAgent.Supervisor.restart(agent)

# State
AlloyAgent.Supervisor.get_agent_state(agent)
AlloyAgent.Supervisor.get_agent_pid(agent)
AlloyAgent.Supervisor.get_state(supervisor)
AlloyAgent.Supervisor.get_status(supervisor)
AlloyAgent.Supervisor.running?(supervisor)
```

### AlloyAgent.Provider

AI provider callback mechanism (Anthropic, OpenAI).

```elixir
# Create provider
AlloyAgent.Provider.create(model: "claude-3-opus", timeout: 30)

# Operations
AlloyAgent.Provider.complete(messages, opts)
AlloyAgent.Provider.stream(messages, opts)
AlloyAgent.Provider.send_message(message: "Hello")

# Info
AlloyAgent.Provider.get_available_models()
# ["claude-3-opus-20240229", "claude-3-sonnet", "claude-3-haiku"]
```

### AlloyAgent.Team

Team coordination module.

```elixir
# Create team
team = AlloyAgent.Team.create("research", ["architect", "builder"])

# Operations
AlloyAgent.Team.get_members(team)
AlloyAgent.Team.add_member(team, "tester")
AlloyAgent.Team.remove_member(team, "scanner")
AlloyAgent.Team.info(team)
AlloyAgent.Team.get_ops(team)
AlloyAgent.Team.add_op(team, :search, %{query: "..."})
AlloyAgent.Team.get_session(team)
AlloyAgent.Team.set_session(team, session)
```

### AlloyAgent.Application

Supervision tree for the application.

```elixir
# Start application
AlloyAgent.Application.start(:normal, [])
```

## Built-in Agents

### Default Agents

```elixir
%{
  architect: %{
    name: "architect",
    description: "orchestration",
    tools: ["bash"],
    team: "all"
  },
  builder: %{
    name: "builder",
    description: "writer",
    tools: ["write"],
    team: "all"
  },
  scanner: %{
    name: "scanner",
    description: "reader",
    tools: ["read", "ls", "find", "grep", "bash"],
    team: "all"
  },
  tester: %{
    name: "tester",
    description: "tester",
    tools: ["bash", "read"],
    team: "all"
  }
}
```

## Default Tools

```elixir
[
  read:   {:filesystem, "Read files", "Read file content"},
  write: {:filesystem, "Write files", "Write file content"},
  find:  {:filesystem, "Find files", "Find files in directory"},
  grep:  {:filesystem, "Search files", "Search file content"},
  ls:    {:filesystem, "List directory", "List directory contents"},
  edit:  {:filesystem, "Edit files", "Edit file contents"},
  bash:  {:terminal, "Run bash commands", "Execute bash"}
]
```