# Alloy Agent System

## Overview

Alloy is the core agent system providing:

- **Agents** - Intelligent agents with memory and state
- **Tools** - External operations (files, APIs, commands)
- **Skills** - Cognitive enhancements (reasoning, analysis)
- **Teams** - Organized agent collections

## Quick Start

```elixir
agent = AlloyAgent.AgentDef.create(
  name: "researcher",
  description: "Research specialist",
  team: "research",
  tools: ["read", "file_search", "web_search"],
  skills: ["critical_analysis", "pattern_recognition"]
)
```

## Tools vs Skills

### Tools Access Information
- Read/write files
- Execute commands
- Make API calls

### Skills Process Information
- Logical reasoning
- Data analysis
- Pattern recognition
- Creative thinking

## Usage

### Tool Examples
```elixir
Alloy.Tool.FileRead.read("file.txt")
Alloy.Tool.SecureShell.exec("ls -la")
Alloy.Tool.FileSearch.search("*")
```

### Skill Examples
```elixir
Alloy.Skill.Deduce.deduce(premises)
Alloy.Skill.Analyze.analyze(data)
Alloy.Skill.Synthesis.synthesize(sources)
```

## Documentation

See:
- `/lib/alloy/tool/README.md` - Tools
- `/lib/alloy/skills/README.md` - Skills
- `/lib/alloy/skills/catalog.md` - Skill catalog
- `/lib/alloy/tool/capabilities.md` - Tool capabilities
