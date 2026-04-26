# Alloy Tools and Skills Usage Guide

<div align="center">

**Complete Guide to Using Tools and Skills**

</div>

---

## 🎯 Overview

Alloy agents can now use both **tools** (external operations) and **skills** (cognitive abilities):

| Type | Purpose | Examples |
|--|-----|--|--|
| **Tools** | External operations | `read`, `bash`, `search` |
| **Skills** | Cognitive abilities | `deduce`, `analyze`, `synthesize` |

---

## 🚀 Quick Start

### Create Agent with Tools and Skills

```elixir
agent = AlloyAgent.AgentDef.create(
  name: "researcher",
  description: "Research specialist",
  team: "research",
  tools: ["read", "file_search", "web_search"],
  skills: ["critical_analysis", "pattern_recognition"]
)
```

### Use Tool

```elixir
{:ok, result} = Alloy.Tool.FileSearch.search("*")
```

### Use Skill

```elixir
{:ok, result} = Alloy.Skill.Deduce.deduce(premises)
```

---

## 🛠️ Available Tools

### Core Tools

| Tool | Description |
|-------|------|
| `read` | Read file |
| `write` | Write file |
| `edit` | Edit file |
| `bash` | Execute command |
| `grep` | Grep content |
| `find` | Find files |
| `ls` | List directory |

### Custom Tools

Create in `/lib/alloy/tool/`:

```elixir
defmodule Alloy.Tool.CustomTool do
  def custom_operation do
    # Implementation
  end
end
```

---

## 🎯 Available Skills

### Core Skills

| Skill | Description |
|-------|------|
| `deduce` | Logical deduction |
| `assess` | Evaluation |
| `analyze` | Data analysis |
| `synthesize` | Information synthesis |
| `imagine` | Creativity |
| `abstract` | Abstraction |
| `connect` | Connection |
| `simplify` | Simplification |
| `persuade` | Persuasion |
| `empathize` | Empathy |

### Custom Skills

Create in `/lib/alloy/skills/`:

```elixir
defmodule Alloy.Skill.CustomSkill do
  def custom_reasoning do
    # Implementation
  end
end
```

---

## 💡 Combining Tools and Skills

### Pattern: Get, Then Process

```elixir
# 1. Use tool to get data
files = Alloy.Tool.FileSearch.search("*")

# 2. Use skill to analyze
analysis = Alloy.Skill.Analyze.analyze(files)

# 3. Use skill to deduce
conclusion = Alloy.Skill.Deduce.deduce(
  analysis,
  goal: "find_insights"
)
```

### Reasoning Chain

```elixir
# Read file with tool
content = Alloy.Tool.FileRead.read("file.txt")

# Analyze content with skill
analysis = Alloy.Skill.Analyze.analyze(content)

# Synthesize findings with skill
synthesis = Alloy.Skill.Synthesis.synthesize(
  sources: [content],
  context: "analysis"
)
```

---

## 📝 Tool Examples

### File Search

```elixir
{:ok, %{files: [...]}} = 
  Alloy.Tool.FileSearch.search(
    pattern: "*.txt",
    recursive: true,
    limit: 100
  )
```

### Web Search

```elixir
{:ok, %{results: [...]}} = 
  Alloy.Tool.WebSearch.search(
    query: "elixir best practices",
    max_results: 10
  )
```

### Secure Shell

```elixir
{:ok, %{output: "..."}} = 
  Alloy.Tool.SecureShell.exec(command: "ls -la")
```

---

## 💡 Skill Examples

### Deduce

```elixir
{:ok, %{conclusion: "...", confidence: 0.92}} = 
  Alloy.Skill.Deduce.deduce(
    premises: ["All humans are mortal"],
    observation: "Bob is human"
  )
```

### Analyze

```elixir
{:ok, %{summary: "...", insights: [...]}} = 
  Alloy.Skill.Analyze.analyze(
    data: report,
    goal: "understand"
  )
```

### Synthesize

```elixir
{:ok, %{combined_view: "...", quality: 0.85}} = 
  Alloy.Skill.Synthesis.synthesize(
    sources: [source1, source2],
    context: "research"
  )
```

---

## 🔧 Registration

### Register Tool

```elixir
Alloy.ToolRegistry.register(
  "file_search",
  "Search for files matching patterns",
  &Alloy.Tool.FileSearch.search/1
)
```

### Register Skill

```elixir
Alloy.SkillRegistry.register_skill(
  "critical_analysis",
  "Critical analysis skill",
  &Alloy.Skill.CriticalAnalysis.analyze/1
)
```

---

## 🎯 Agent Capabilities

Get agent capabilities:

```elixir
capabilities = AlloyAgent.AgentDef.capabilities(agent)

# Returns
%{
  tools_enabled: true,
  tools: ["read", "write"],
  skills_enabled: true,
  skills: ["deduce", "analyze"]
}
```

---

<div align="center">

**End of Usage Guide**

</div>
