# 🔧 Alloy Tool Capabilities

<div align="center">

**Define and configure Agent Tools**

</div>

---

## 🎯 Tool vs Skill Overview

| Aspect | Tools | Skills |
|--------|-|--|-|--|---|
| Type | External operations | Cognitive abilities |
| Purpose | Access information | Enhance reasoning |
| Examples | `read`, `bash`, `bash` | `deduce`, `analyze` |
| Output | Results, data | Enhanced thinking |

---

## 🛠️ Available Tools

### Core Tools (Built-in)

| Tool | Category | Purpose |
|------|-|--|--|
| `read` | File | Read file contents |
| `write` | File | Write file contents |
| `edit` | File | Edit file contents |
| `bash` | Shell | Execute shell commands |
| `grep` | Shell | Grep file contents |
| `find` | Shell | Find files |
| `ls` | Shell | List directory |

### Custom Tools

| Tool | Category | Purpose |
|------|-|--|-|
| `file_search` | Search | Search for files |
| `web_search` | Web | Search web pages |
| `http-client` | HTTP | Make API calls |
| `docker-exec` | Container | Execute in containers |

---

## 🎭 Available Skills

### Core Skills (Built-in)

| Skill | Category | Purpose |
|-------|----------|---------|
| `deduce` | Reasoning | Logical deduction |
| `assess` | Analysis | Evaluation |
| `evaluate` | Analysis | Assessment |
| `analyze` | Analysis | Data analysis |
| `synthesize` | Analysis | Information synthesis |
| `imagine` | Creativity | Ideation |
| `abstract` | Creativity | Abstraction |
| `connect` | Creativity | Connection |
| `simplify` | Communication | Simplification |
| `persuade` | Communication | Persuasion |
| `empathize` | Communication | Empathy |

### Custom Skills

| Skill | Category | Purpose |
|-------|----------|---------|
| `cross_reference` | Research | Cross-reference |
| `critical_analysis` | Analysis | Critical thinking |
| `pattern_recognition` | Pattern | Pattern detection |
| `data_integration` | Data | Data integration |

---

## 📝 Using Tools and Skills

### Agent Definition

```elixir
agent = AlloyAgent.AgentDef.create(
  name: "research_analyst",
  description: "Analyzes research documents",
  team: "research",
  tools: ["read", "file_search", "web_search"],
  skills: ["critical_analysis", "data_synthesis"]
)
```

### Tool + Skill Combination

```elixir
# Use tool to get information
tool_result = Alloy.Tool.FileSearch.search("*")

# Use skill to analyze the results
skill_result = Alloy.Skill.Analyze.analyze(tool_result)
```

### Skills Without Tools

Skills can operate independently:

```elixir
# Skill without tool
skill_result = Alloy.Skill.Deduce.deduce(
  premises: ["All humans are mortal"],
  observation: "Bob is human"
)
```

---

## 🚀 Best Practices

### When to Use Tools

1. You need to access external systems
2. You need to execute commands
3. You need to read/write files
4. You need to make API calls

### When to Use Skills

1. You need better reasoning
2. You need domain expertise
3. You need pattern recognition
4. You need creative thinking

### Combine for Best Results

```elixir
tools: ["read", "write"],     # Access information
skills: ["critical_analysis"], # Analyze it
```

---

<div align="center">

**End of Tool Capabilities**

</div>
