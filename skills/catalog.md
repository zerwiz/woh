# 🎭 Alloy Skill Catalog

<div align="center">

**Define and configure Agent Skills**

</div>

---

## 🎯 Skill Categories

### Reasoning Skills

| Skill | Purpose | Example Use |
|-------|--------|----
| `deduce` | Logical deduction | Draw conclusions from premises |
| `assess` | Evaluation | Judge quality or validity |
| `evaluate` | Assessment | Assess against criteria |

### Analysis Skills

| Skill | Purpose | Example Use |
|-------|--------|----|
| `analyze` | Data analysis | Break down complex data |
| `synthesize` | Integration | Combine multiple sources |
| `critique` | Evaluation | Provide critique |

### Creativity Skills

| Skill | Purpose | Example Use |
|-------|--------|----|
| `imagine` | Ideation | Generate ideas |
| `abstract` | Abstraction | Create abstractions |
| `connect` | Association | Make connections |

### Communication Skills

| Skill | Purpose | Example Use |
|-------|--------|----|
| `simplify` | Clarification | Simplify complex ideas |
| `persuade` | Influence | Persuade effectively |
| `empathize` | Understanding | Understand perspectives |

---

## 📚 Built-in Skills

### Reasoning

```elixir
Alloy.Skill.Deduce.deduce(
  premises: ["All A are B", "Some C are A"],
  conclusion: "Some C are B"
)
```

### Analysis

```elixir
Alloy.Skill.Analyze.analyze(
  data: large_dataset,
  goal: "understand"
)

Alloy.Skill.Synthesis.synthesize(
  sources: [source1, source2],
  context: "general"
)
```

### Creativity

```elixir
Alloy.Skill.Imagine.imagine(
  constraints: [c1, c2, c3],
  domain: "design"
)
```

### Communication

```elixir
Alloy.Skill.Empathize.empathize(
  perspective: user_context,
  situation: conflict
)
```

---

## 📝 Custom Skills

### Creating Custom Skills

1. **Define in `/lib/alloy/skills/`** - Create skill files
2. **Name**: `skill_name.ex` - Elixir modules
3. **Module**: `Alloy.Skill.SkillName` - Module names
4. **Register**: Use `Alloy.SkillRegistry.register()`

### Example Custom Skill

```elixir
defmodule Alloy.Skill.CrossReference do
  @moduledoc """
  Cross-reference information across sources.
  """

  def cross_reference(%{topic: topic, sources: sources}) do
    connections = find_connections(topic, sources)
    {:ok, %{connections: connections}}
  end
end

# Register
Alloy.SkillRegistry.register("cross_reference", "Cross-reference", &cross_reference/1)
```

---

## 🔧 Skill Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Source information |
| `context` | string | Context for operation |
| `priority` | float | Priority/weight |
| `weight` | float | Influence weight |

---

## 🚀 Skill Examples

### Analysis

```elixir
Alloy.Skill.Analyze.analyze(
  data: report_contents,
  goal: "summary"
)
```

### Synthesis

```elixir
Alloy.Skill.Synthesis.synthesize(
  sources: [article1, article2, article3],
  context: "research"
)
```

### Reasoning

```elixir
Alloy.Skill.Deduce.deduce(
  premises: ["Humans need oxygen"],
  observation: "Bob is human"
)
```

---

<div align="center">

**End of Skill Catalog**

</div>
