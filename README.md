# WHO Agents

**Alloy-based Multi-Agent System for Local-First AI Development**

Local-First AI Development with small local models that work best for local programming workflows.

<div align="center">

⚡ Small Models | 🔒 Privacy-First | 🏠 No Cloud Dependencies | 💾 Self-Contained

</div>

---

## 🎯 Why This Project?

This repository demonstrates why small local language models are ideal for local development workflows. By running models locally, you maintain full control over your data, reduce latency, and eliminate cloud API costs.

> "The right tool for the job doesn't require infinite compute power—sometimes small is perfectly powerful."

---

## 📋 Quick Start

### Prerequisites

- Alloy Agent (based on Chris O'Halloran's Alloy library)
- Local LLM setup (e.g., Ollama, LM Studio, or local GPU/CPU inference)
- Elixir/Alloy environment

### Installation

```bash
# Clone or access this repository
cd /path/to/who

# Enable WHO Agents extension
pi -e extensions/who-agents.ts
```

### First Steps

1. **Configure your local model** - Set up your preferred local LLM (Llama, Mistral, etc.)
2. **Define your agents** - Create agent definitions in the `agents/` directory
3. **Create teams** - Organize agents into teams using `teams.yaml`
4. **Start working** - Use the `/who-agents` command to activate the system

---

## 🤖 Available Agents

| Agent | Role | Tools | Description |
|-------|------|-------|-------------|
| architect | Core | - | Local architecture design |
| coder | Developer | read, write, bash | Local code implementation |
| reviewer | Analyst | read, write, bash | Code review and validation |
| tester | Validator | bash, read | Local testing & validation |
| researcher | Researcher | read, write, find | Local documentation & research |

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `read` | Read files with line numbers |
| `write` | Write files (creates parent directories) |
| `edit` | Search-and-replace in files |
| `bash` | Execute shell commands |
| `grep` | Search file contents |
| `find` | Search for files |
| `ls` | List directories |

---

## 🏗️ Architecture Overview

```
┌───────────────┐         ┌───────────────┐
│  Dispatcher   │ ──────▶│  Local Agent   │
│   (Primary)   │        │    (Local)     │
│  ┌──────────┐ │        └───────────────┘
│  │ Orchestrates│       │ Runs locally   │
│  │ via tools  │       │ No cloud needed │
│  └──────────┘ │        └───────────────┘
└───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Team Manager  │
            │ - YAML teams  │
            │ - State mgmt  │
            └───────────────┘
```

### Key Features

- ✅ **Fully Local** - All operations run on your machine
- ✅ **Privacy-First** - Your data never leaves your computer
- ✅ **Small Models** - Optimized for local hardware
- ✅ **No Cloud Dependencies** - Zero external API calls
- ✅ **Self-Contained** - Complete offline capability

---

## 💻 Usage

### Tool Examples

```elixir
# Read a file
Alloy.Tool.FileRead.read("file.txt")

# Execute local commands
Alloy.Tool.SecureShell.exec("ls -la")

# Search local files
Alloy.Tool.FileSearch.search("*")

# Edit local files
Alloy.Tool.FileEdit.edit("file.txt", "old", "new")
```

### Team Configuration

**File:** `.pi/agents/teams.yaml`

```yaml
# Team definitions
local-dev:
  - coder
  - reviewer
  - tester

documentation:
  - researcher
  - archivist

operations:
  - monitor
  - maintainer
```

---

## 🎨 Widget Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/who-agents` | Select active team | Shows team selection dialog |
| `/who-agents-list` | List all agents | Shows agent status |
| `/who-agents-grid N` | Set widget columns | `/who-agents-grid 4` |
| `/who-agents-clear` | Clear all states | Start fresh session |

---

## 📁 Project Structure

```
project/
├── .pi/
│   ├── agents/
│   │   ├── teams.yaml           # Team definitions
│   │   ├── coder.md             # Agent definitions
│   │   └── reviewer.md
│   └── agent-sessions/          # Session state files
├── agents/                      # Generic agent definitions
│   ├── coder.md
│   └── reviewer.md
├── docs/                        # Documentation
└── scripts/
    ├── setup-agents.sh
    └── deploy-agents.sh
```

---

## ⚙️ Configuration Options

### Model Configuration

```bash
# Local model path
export MODEL_PATH=./models

# API key (empty for local)
export API_KEY=""

# Session directory
export SESSION_DIR=.pi/agent-sessions

# Team directory
export TEAMS_DIR=.pi/agents
```

### Agent Definition Format

```yaml
---
name: [Unique Agent Name]
description: [Brief Description]
tools: [Comma-Separated List]
---
[Agent System Prompt and Protocols]
```

---

## 📋 Best Practices

### Agent Definition Guidelines

1. **Name** - Use clear, descriptive names (noun, not verb)
2. **Description** - One-line functional description
3. **Tools** - Only list needed tools
4. **Prompt** - Include operational protocols
5. **Context** - Be explicit about limitations

### Team Organization

1. **Separation of Concerns** - Group by function
2. **Clear Boundaries** - No overlap between teams
3. **Purpose Documentation** - Comment team YAML files

### Local-First Philosophy

- **Keep data local** - Never upload code or data to cloud
- **Use small models** - Optimize for your hardware
- **Test locally** - Validate before any deployment
- **Self-host everything** - Full control over your stack

---

## 🐛 Troubleshooting

### Common Issues

**"No agents found"**
- Check agent files in `.pi/agents/`, `agents/`
- Verify frontmatter syntax
- Ensure `.md` extension

**"Agent not found"**
- Check name spelling (case-insensitive)
- Verify team.yaml references
- Run `/who-agents-list` to see loaded agents

**"Model not found"**
- Verify local model path is set
- Check model is loaded in your inference engine
- Restart Pi after model installation

**"Widget doesn't appear"**
- Update widget: `pi -e extensions/who-agents.ts`
- Force update: `/who-agents-grid`
- Check console for errors

### Debug Workflow

```bash
# List all agents
pi -e extensions/who-agents.ts /who-agents-list

# Toggle team
pi -e extensions/who-agents.ts /who-agents-team

# View session
cat .pi/agent-sessions/your-agent.json

# Clear state
pi -e extensions/who-agents.ts /who-agents-clear
```

---

## 🔐 Security Considerations

### Local-First Security

- **No data exfiltration** - Everything stays on your machine
- **Local model inference** - Your models never see external data
- **No cloud APIs** - Zero external dependencies
- **Local storage** - All sessions stored locally

### Best Practices

1. **Keep models updated** - Regular local model maintenance
2. **Use secure paths** - Protect model files from unauthorized access
3. **Monitor sessions** - Clear old sessions when done
4. **Validate inputs** - Prevent command injection

---

## 📚 Examples

### Example 1: Local Code Review

```yaml
# Task: "Review and refactor utils/helpers.ts"

# Local workflow:
# 1. coder agent: Initial review (local)
# 2. reviewer agent: Code quality check (local)
# 3. archivist: Update changelog (local)
```

### Example 2: Documentation Generation

```yaml
# Task: "Generate API documentation from local codebase"

# Local workflow:
# 1. researcher agent: Scan local files
# 2. researcher agent: Generate docs
# 3. archivist agent: Save to local docs folder
```

---

## 📞 Support

### Getting Help

- **GitHub Issues:** Report bugs and feature requests
- **Community:** Discuss local-first AI development
- **Documentation:** Check docs/ directory

### Reporting Issues

Include:
- Error message
- Steps to reproduce
- Team configuration
- Agent definitions
- Local model information

---

## 📜 License

MIT License - See LICENSE file for details.

---

## 👨‍💻 Project Author

Made by [zerwiz](https://github.com/zerwiz)

- 🌐 Website: https://whynotproductions.netlify.app
- 💻 GitHub: https://github.com/zerwiz/who

---

<div align="center">

**WHO Agents** - Multi-agent system for local-first AI development

_Based on Chris O'Halloran's Alloy Agent library_
_Showing that small local models work best for local programming_

[Alloy Documentation](https://hexdocs.pm/alloy/Alloy.html) |
[Alloy GitHub](https://github.com/alloy-ex/alloy)

</div>