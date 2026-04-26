# Tools & Skills Reference

Documentation for the tool and skill systems that integrate with Alloy Agent.

## Tools Location

Tools are located in `/home/zerwiz/woh/tools/`:

```
tools/
├── core/           # Core tool implementations
├── executor.ex     # Tool execution engine
├── file_search.ex  # File search tool
├── registry.ex     # Tool registry
├── secure_shell.ex # Secure shell execution
├── web_search.ex   # Web search tool
└── capabilities.md
```

## Skills Location

Skills are located in `/home/zerwiz/woh/skills/`:

```
skills/
├── analyze.ex      # Analysis skill
├── deduce.ex      # Deduction skill
├── synthesis.ex   # Synthesis skill
├── registry.ex    # Skill registry
└── catalog.md
```

## Available Tools

### Core Tools

| Tool | Description | Category |
|------|-------------|----------|
| `read` | Read file content | filesystem |
| `write` | Write file content | filesystem |
| `edit` | Edit/replace text | filesystem |
| `ls` | List directory | filesystem |
| `find` | Find files | filesystem |
| `grep` | Search content | filesystem |
| `bash` | Execute shell | terminal |

### Extended Tools

| Tool | Description |
|------|-------------|
| `file_search` | Search files by pattern |
| `web_search` | Search the web |
| `secure_shell` | Sandboxed shell execution |
| `http-client` | Make REST API calls |

### Tool Executor

The tool executor (`executor.ex`) handles:

- Parallel tool execution via `Task.Supervisor.async_stream`
- Tool timeouts
- Error handling and recovery
- Middleware hooks
- Telemetry events

```elixir
# Execute all tools
Alloy.Tool.Executor.execute_all(tool_calls, tool_fns, state)

# Execute single tool
Alloy.Tool.Executor.execute_all([call], tool_fns, state)
```

## Available Skills

### Cognitive Skills

| Skill | Description | Example |
|-------|-------------|---------|
| `deduce` | Logical deduction | "If A implies B, and A is true, then B is true" |
| `analyze` | Data analysis | "Analyze the structure of this code" |
| `synthesis` | Information synthesis | "Combine findings into summary" |
| `imagine` | Creativity/ideation | "Brainstorm novel approaches" |

### Skill Registry

```elixir
# Register a skill
Alloy.SkillRegistry.register(
  "my_skill", 
  "Description", 
  &handler/1,
  priority: 0.8
)

# Execute skill
Alloy.SkillRegistry.execute("deduce", %{input: "..."})

# Get skill handler
handler = Allo

y.SkillRegistry.handler("analyze")
```

## Creating Custom Tools

### Structure

```elixir
defmodule Alloy.Tool.MyTool do
  @moduledoc "Custom tool description"
  
  import Alloy.ToolExecutor

  @doc "Execute the tool"
  @spec execute(map(), map()) :: {:ok, term()} | {:error, term()}
  def execute(input, context) do
    # Implementation
    {:ok, %{result: "..."}}
  end
end
```

### Registration

```elixir
# In application.ex
def start(_type, _args) do
  Alloy.ToolRegistry.register("my_tool", "Description", &MyTool.execute/2)
  # ...
end
```

### With Capabilities

```elixir
defmodule Alloy.Tool.FileSearch do
  @concurrent? false  # Prevent parallel execution

  @doc "Max result characters"
  def max_result_chars, do: 10_000
end
```

## Creating Custom Skills

### Structure

```elixir
defmodule Alloy.Skill.MySkill do
  @moduledoc "Custom skill description"

  @doc "Apply the skill"
  @spec apply(map()) :: {:ok, term()} | {:error, term()}
  def apply(input) do
    # Implementation
    {:ok, %{insight: "..."}}
  end
end
```

### Registration

```elixir
# In application.ex
def start(_type, _args) do
  Alloy.SkillRegistry.register_skill("my_skill", "Description", &MySkill.apply/1)
  # ...
end
```

## Tool Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pattern` | string | Regex or glob pattern |
| `path` | string | Path to search |
| `recursive` | boolean | Search recursively |
| `limit` | integer | Result limit |
| `timeout` | integer | Execution timeout |

## Skill Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | Topic to process |
| `sources` | list | Source information |
| `context` | map | Additional context |
| `priority` | float | Priority weight |

## Security

### Command Validation

```elixir
defmodule Alloy.Tool.Security do
  @allowed_commands ~w(bash grep find ls read write)
  
  def allowed?(command), do: command in @allowed_commands
end
```

### File Access Control

```elixir
defmodule Alloy.Tool.FileAccess do
  def allow?(agent, path) do
    agent.team in ~w[read search]
  end
end
```

## Best Practices

1. **Single Responsibility** - Each tool/skill does one thing
2. **Error Handling** - Always return `{:ok, ...}` or `{:error, ...}`
3. **Documentation** - Document inputs/outputs
4. **Type Safety** - Use specs and types
5. **Testing** - Write unit tests

## Integration with Agent

Tools and skills are integrated through:

1. **Registry** - `AlloyAgent.Registry` for tools, `Alloy.SkillRegistry` for skills
2. **Definition** - Specified in agent definition
3. **Dispatcher** - Executed via `AlloyAgent.Dispatcher`
4. **Executor** - `Alloy.Tool.Executor` runs tool calls

## Related Documentation

- [Agent API](API.md)
- [START.md](START.md)
- Tools README: `/home/zerwiz/woh/tools/README.md`
- Skills README: `/home/zerwiz/woh/skills/README.md`