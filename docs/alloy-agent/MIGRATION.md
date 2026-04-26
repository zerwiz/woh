# Tools and Skills Migration Guide

## What Changed?

### Before (Simple Agents)

```elixir
defmodule AlloyAgent.AgentDef do
  defstruct [
    :name,
    :description,
    :team,
    :tools
  ]
end
```

### After (Tools + Skills)

```elixir
defmodule AlloyAgent.AgentDef do
  defstruct [
    :name,
    :description,
    :team,
    :tools,      # External operations
    :skills,     # Cognitive abilities
    :priority,
    :enabled_tools,
    :enabled_skills
  ]
end
```

## Migration Steps

### 1. Update Agent Definitions

```elixir
# Before
agent = AlloyAgent.AgentDef.create(
  name: "agent1",
  description: "Description",
  team: "team1"
)

# After
agent = AlloyAgent.AgentDef.create(
  name: "agent1",
  description: "Description",
  team: "team1",
  tools: ["read", "write"],    # Optional
  skills: ["deduce", "analyze"],  # Optional
  priority: 0.8,              # Optional
  enabled_tools: true,        # Optional
  enabled_skills: true        # Optional
)
```

### 2. Add Custom Tools

Create files in `/lib/alloy/tool/`:

```elixir
defmodule Alloy.Tool.CustomTool do
  def custom_operation(%{param: value}) do
    # Your implementation
  end
end
```

### 3. Add Custom Skills

Create files in `/lib/alloy/skills/`:

```elixir
defmodule Alloy.Skill.CustomSkill do
  def custom_reasoning(%{context: info}) do
    # Your implementation
  end
end
```

## Tool Examples

### File Operations

```elixir
# Read file
{:ok, result} = Alloy.Tool.FileRead.read("file.txt")

# Write file  
{:ok, result} = Alloy.Tool.FileWrite.write("file.txt", "content")

# Edit file
{:ok, result} = Alloy.Tool.FileEdit.edit("file.txt", changes)
```

### Command Execution

```elixir
{:ok, result} = Alloy.Tool.SecureShell.exec("ls -la")
{:ok, result} = Alloy.Tool.Grep.grep("pattern", "file.txt")
```

### Search Tools

```elixir
{:ok, result} = Alloy.Tool.FileSearch.search("*")
{:ok, result} = Alloy.Tool.WebSearch.search("topic")
```

## Skill Examples

### Reasoning

```elixir
{:ok, result} = Alloy.Skill.Deduce.deduce(
  premises: ["All A are B", "Some C are A"],
  conclusion: "Some C are B"
)
```

### Analysis

```elixir
{:ok, result} = Alloy.Skill.Analyze.analyze(
  data: report,
  goal: "understand"
)
```

### Synthesis

```elixir
{:ok, result} = Alloy.Skill.Synthesis.synthesize(
  sources: [source1, source2],
  context: "general"
)
```

## Registration

### Register Tool

```elixir
Alloy.ToolRegistry.register(
  "my_custom_tool",
  "Custom tool description",
  &handle_function/1
)
```

### Register Skill

```elixir
Alloy.SkillRegistry.register_skill(
  "my_custom_skill",
  "Custom skill description",
  &handle_function/1
)
```

## Best Practices

### When to Use Tools

- Need to access external data
- Need to execute operations
- Need to query resources

### When to Use Skills

- Need to reason logically
- Need to analyze data
- Need to find patterns
- Need to create ideas

### Combine Both

```elixir
# Get data with tool, process with skill
files = Alloy.Tool.FileSearch.search("*")
analysis = Alloy.Skill.Analyze.analyze(files)
```

## Available Tools

| Tool | Purpose |
|-------|-------|
| `read` | Read files |
| `write` | Write files |
| `edit` | Edit files |
| `bash` | Commands |
| `grep` | Grep files |
| `find` | Find files |
| `ls` | List dirs |

## Available Skills

| Skill | Purpose |
|-------|-------|
| `deduce` | Reasoning |
| `assess` | Evaluation |
| `analyze` | Analysis |
| `synthesize` | Integration |
| `imagine` | Creativity |
| `abstract` | Abstraction |
| `connect` | Association |
| `simplify` | Clarity |
| `persuade` | Persuasion |
| `empathize` | Empathy |

<div align="center">

**End of Migration Guide**

</div>
