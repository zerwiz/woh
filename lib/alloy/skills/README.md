# 🎭 Alloy Skill System

<div align="center">

**Define and implement custom agent skills in Alloy**

</div>

---

## 🎯 About Skills

**Skills** are cognitive abilities that enhance an agent's capabilities without requiring external tool execution. Skills represent:

- **Pattern recognition** - Identifying complex patterns
- **Contextual reasoning** - Understanding context better
- **Domain expertise** - Specialized knowledge areas
- **Problem-solving approaches** - Methodical problem-solving
- **Style preferences** - Ways of thinking about problems

### Examples of Custom Skills

- **`data-synthesis`** - Synthesize data from multiple sources
- **`cross-reference`** - Connect information across domains
- **`critical-analysis`** - Analyze arguments deeply
- **`pattern-detection`** - Find patterns in data
- **`creative-thinking`** - Generate novel ideas

---

## 📝 Creating a Skill

### Structure

1. **Create file** in `/lib/alloy/skills/` or subdirectory
2. **Name**: `skill_name.ex`
3. **Module**: Must start with `Alloy.Skill.` prefix
4. **Format**: Elixir module with skill definition

### Skill Example

```elixir
defmodule Alloy.Skill.CrossReference do
  @moduledoc """
  Skill for cross-referencing information across sources.
  
  Usage: cross_reference(topic, sources)
  """

  import Alloy.SkillRegistry

  @doc "Cross-references information across sources"
  def cross_reference(%{
    topic: topic,
    sources: sources
  }) do
    # Apply cross-reference reasoning
    connections = find_connections(topic, sources)
    {:ok, %{connections: connections}}
  end
end
```

### Skill Registration

```elixir
Application.start(:alloy) do
  Alloy.SkillRegistry.register_skill("cross_reference", "Cross-reference information", &cross_reference/1)
end
```

---

## 💭 Skill Categories

### Cognitive Skills

- **Reasoning**: Logic, deduction, inference
- **Analysis**: Breakdown, synthesis, evaluation
- **Creativity**: Ideation, abstraction, connection

### Domain Skills

- **Research**: Literature review, fact-checking
- **Coding**: Code understanding, generation
- **Writing**: Drafting, editing, formatting
- **Mathematics**: Calculation, proof verification

### Interpersonal Skills

- **Communication**: Clear explanation, empathy
- **Conflict Resolution**: Finding common ground
- **Negotiation**: Win-win solutions
- **Leadership**: Goal alignment, motivation

---

## 🎯 Skill Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|---|---|
| `topic` | string | Topic of the skill operation |
| `sources` | list | List of source information |
| `priority` | integer | Importance/priority weight |
| `weight` | float | Influence weight in reasoning |
| `context` | map | Additional context needed |

---

## 🧠 Applying Skills

### In Agent Prompt

Skills are applied in the agent's system prompt:

```elixir
defmodule AlloyAgent.AgentDefinition do
  def with_skill(agent_def, skill_name) do
    %{agent_def | skills: [skill_name]}
  end
end

# Usage
agent = new_agent(
  name: "researcher",
  description: "Research specialist",
  skills: ["cross_reference", "data_synthesis"]
)
```

### Skill Application Flow

```
Agent Request ──▶ Check Available Skills
                          │
                          ▼
              Apply Relevant Skills
                          │
                          ▼
              Enhance Reasoning
                          │
                          ▼
              Generate Better Response
```

---

## 📚 Built-in Skills

The Alloy framework provides these built-in skills:

- **Reasoning**: `deduce`, `assess`, `evaluate`
- **Analysis**: `breakdown`, `synthesize`, `critique`
- **Creativity**: `imagine`, `abstract`, `connect`
- **Communication**: `simplify`, `persuade`, `empathize`

---

## 🚀 Combining Tools and Skills

### Example: Research Workflow

```elixir
defmodule Alloy.Skill.ResearchFlow do
  @moduledoc """
  Skill for conducting systematic research with tools.
  
  Combines:
  - Tool: find_files, read
  - Skill: critical_analysis, synthesis
  """

  @doc "Conduct thorough research"
  def research(%{
    topic: topic,
    tools: [read, find_files],
    skills: [critical_analysis]
  }) do
    # 1. Use tools to gather information
    files = find_files(%{pattern: "*.md"})
    
    # 2. Read files
    content = read(files)
    
    # 3. Apply critical analysis skill
    analysis = critical_analysis(content)
    
    # 4. Synthesize findings
    synthesis = synthesis(analysis)
    
    {:ok, %{findings: synthesis}}
  end
end
```

---

## 🔧 Skill Parameters

### Skill Definition

```elixir
defmodule Alloy.Skill.AnalyzeData do
  def struct_analyze(%{
    data: data,
    metrics: metrics,
    goal: "understand_distribution"
  }) do
    # Analyze data distribution
  end
end
```

---

## 📖 Related Documentation

- **Tools Documentation**: `/tools/README.md`
- **Agent Definitions**: `agent_def.ex`
- **Skill Registry**: `skill_registry.ex` (create if needed)

---

<div align="center">

**End of Skills Documentation**

</div>