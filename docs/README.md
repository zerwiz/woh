# Alloy Agent Team

Multi-agent system with specialized agents for system development.

## Quick Start

```elixir
# Start application
AlloyAgent.Application.start()

# Get all agents
AlloyAgent.agents()
["architect", "builder", "scanner", "tester"]

# Get all tools
AlloyAgent.tools()
["read", "write", "ls", "find", "grep", "bash", "edit"]

# Get agent info
AlloyAgent.agent_info("architect")
%{name: "architect", tools: [], description: "Architecture agent"}
```

## Agents

| Agent | Role | Tools | Description |
|-------|------|-------|-------------|
| architect | Core | - | Architecture design |
| builder | Builder | write | Code implementation |
| scanner | Scanner | read, ls, find, grep, bash | System discovery |
| tester | Tester | bash, read | Validation & testing |

## Available Tools

- `read` - Read files
- `write` - Write files
- `ls` - List directories
- `find` - Search files
- `grep` - Search content
- `bash` - Run shell commands
- `edit` - Edit files

## API Reference

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

## Modules

- `AlloyAgent` - Main API
- `AlloyAgent.Memory` - Memory management
- `AlloyAgent.Session` - Session handling
- `AlloyAgent.AgentDefinition` - Agent definitions
- `AlloyAgent.Registry` - Agent registry
- `AlloyAgent.Definition` - Definition parsing
- `AlloyAgent.State` - State management
- `AlloyAgent.Dispatcher` - Task dispatching
- `AlloyAgent.Tools` - Tool management
- `AlloyAgent.Team` - Team coordination
- `AlloyAgent.Supervisor` - Process supervision
- `AlloyAgent.Agent` - Agent operations

## License

MIT
