# 📖 Alloy Agent Team - User Usage Guide

<div align="center">

**Welcome to Alloy Agent Team!**

A comprehensive guide for using the multi-agent orchestration system.

![Status](https://img.shields.io/badge/status-production-ready-brightgreen)

</div>

---

## 🎯 What You'll Learn

- Setting up agent team
- Using the `/agents-*` commands
- Creating and registering agents
- Managing teams
- Best practices and tips

---

## 🚀 Quick Start

### 1. Enable the Extension

```bash
# Add to your .pi directory or run command
pi -e extensions/agent-team.ts
```

### 2. Create Your First Agent

**File:** `.pi/agents/searcher.md`
```yaml
---
name: searcher
description: Search through files and find what you need
models: llama-3.1-8b
tools: read,write,edit,bash,grep,find,ls
---
You are the searcher agent. Your job is to find information in the codebase.

Search for files, read their contents, and bring information to your team.

[SIGNAL_COMPLETE]
```

### 3. Register in Teams

**File:** `.pi/agents/teams.yaml`
```yaml
search-team:
  - searcher
  - reader
  - indexer
```

### 4. Select Your Team

```bash
# In Pi terminal
/agents-team
```

---

## 💻 Available Commands

### `/agents-team [team-name]`

Select which team to work with.

**Example:**
```bash
/agents-team           # Shows team selection
/agents-team research  # Select "research" team
```

**Output:**
```
Select Team:
  research - Scout, Analyst, Researcher
  development - Coder, Reviewer, Tester
  
Team chosen: research
Active team: research (3 agents)
```

### `/agents-list`

Display all loaded agents and their status.

**Output:**
```
Scout (idle, new, runs: 1)
Builder (idle, new, runs: 0)
Viewer (idle, resumed, runs: 5)
```

### `/agents-grid [n]`

Set the number of columns in the agent grid.

**Example:**
```bash
/agents-grid 2         # 2 columns (default)
/agents-grid 4         # 4 columns
```

### `/agents-clear`

Clear all agent states and start fresh.

**Useful for:**
- Starting a new project
- Debugging
- Fresh session

---

## 📋 Agent Status Indicators

When viewing agents, each shows:

- **●** - Active/running
- **○** - Idle/waiting
- **✓** - Completed successfully
- **✗** - Error occurred

Additional info includes:
- Time elapsed
- Number of tools used
- Context window usage

---

## 🎨 Team Structure

### Visual Layout

```
┌─ Team: research (3)
│
├─ Scout      [idle, new, runs: 1]
│
├─ Analyst    [idle, new, runs: 0]
│
└─ Researcher [idle, resumed, runs: 5]
```

**Layout:**
- **●** Active agent
- **○** Idle agent
- Shows elapsed time for active agents
- Shows tool count and context usage

---

## 📝 Creating New Agents

### Required Frontmatter

```yaml
---
name: agent-name         # Required - unique per system
description: brief desc  # Optional - shown in UI
models: model/id         # Optional - which model
tools: tool1,tool2       # Optional - available tools
version: 1.0             # Optional - versioning
---
[Agent instructions and protocols]
```

### Best Agent Structure

```yaml
---
name: coder
description: Implement code from specifications
models: llama-3.1-8b
tools: read,write,edit,bash,grep,find,ls
---
You are the coder agent. Your objective is code implementation.

## MISSION: Code Development
You implement code from specifications and requirements.

## Mandatory Operational Protocol
1. Review existing code using read, find, ls
2. Create new files with write
3. Implement changes with edit
4. Execute with bash
5. [SIGNAL_COMPLETE] when finished

## Strict Edit Protocol
[Specific rules about when to edit files]

## Termination Protocol
[Rules for stopping work]
[SIGNAL_COMPLETE] on completion
```

---

## 🔑 Key Directories

### `.pi/agents/`

Primary agent directory:

```
.pi/
└── agents/
    ├── teams.yaml           # Team definitions
    ├── searcher.md          # Searcher agent
    ├── reader.md            # Reader agent
    └── indexer.md           # Indexer agent
```

### `.pi/agent-sessions/`

Session persistence:

```
.pi/
└── agent-sessions/
    ├── searcher.json        # Searcher session
    ├── reader.json          # Reader session
    └── indexer.json         # Indexer session
```

### Sample Team Configs

**Research Team:**
```yaml
research:
  - scout
  - analyst
  - researcher
```

**Development Team:**
```yaml
development:
  - coder
  - coder-reviewer
  - tester
  - archivist
```

---

## 🎁 Best Practices

### Agent Naming

- Use **action-noun** format
- Example: `researcher`, `coder`, `viewer`
- Avoid generic names like `Agent1`

### Team Organization

- **Group by purpose:**
  - `research-team`: scout, analyst, researcher
  - `development-team`: coder, tester, archivist
  - `operations-team`: monitor, maintainer, deployer

### Agent Instructions

- Use **clear, imperative** language
- Include **mandatory** protocols
- Specify **termination** conditions
- Add **strict edit** guidelines

### Session Management

- **Clear old sessions** before starting new work
- **Monitor context usage** to avoid overflow
- **Use** `SIGNAL_COMPLETE` to mark completion

---

## 🛠️ Tooling Guide

### Dispatch Agent

```yaml
dispatch_agent:
  agent: searcher      # Agent to dispatch
  task: "Find all .md files"  # Task description
```

### Output Format

```json
{
  "status": "done",    # or "error"
  "output": "Result...",
  "elapsed": 42000,    # milliseconds
  "tools_used": ["read", "find"]
}
```

---

## 🎯 Task Examples

### Example 1: Information Gathering

```yaml
Task: "Analyze project file structure"
Steps:
  1. Use searcher to map files
  2. Use reader to document
  3. Use indexer to create index
```

### Example 2: Code Implementation

```yaml
Task: "Implement new auth system"
Steps:
  1. Use coder-reviewer to design
  2. Use coder to implement
  3. Use reviewer to validate
  4. Use archivist to document
```

---

## 📊 Performance Tips

### Optimizing Responses

1. **Choose right agent** - Match task to agent expertise
2. **Keep tasks focused** - One clear objective
3. **Reuse agents** - Agents remember from previous work
4. **Clear sessions** - Start fresh for unrelated tasks

### Monitoring Usage

- **Widget shows** time and tool usage
- **Context bar** shows usage percentage
- **Watch for** approaching limit (> 80%)

---

## 🔧 Advanced Usage

### Multiple Teams in Same Session

```yaml
# teams.yaml
research:
  - scout
  - analyst

development:
  - coder
  - reviewer
  - tester

operations:
  - monitor
  - maintainer
```

```bash
# Switch between teams
/agents-team research    # Research tasks
/agents-team development # Development tasks
```

### Agent Validation

Before dispatch, validation checks:
- Agent exists
- Agent in team
- Session state valid
- Tool permissions correct

---

## ❓ Frequently Asked Questions

### Q: What if an agent is idle?

**A:** All agents start idle. They activate when a task is dispatched or team is selected.

### Q: Can I delete agents?

**A:** Remove the `.md` file from agent directory. New agents loaded on next session.

### Q: How to persist agent state?

**A:** Session files in `.pi/agent-sessions/` persist state across invocations.

### Q: What is the maximum tools list?

**A:** Any list separated by commas. Common: `read,write,edit,bash,grep,find,ls`

### Q: Can I have multiple dispatcher agents?

**A:** Only one dispatcher per session. Use teams to organize specialist agents.

---

## 🎓 Learning Path

1. **Read this guide** - Understand commands and usage
2. **Create test agents** - Experiment with different configurations
3. **Build a team** - Define teams in `teams.yaml`
4. **Write agent prompts** - Craft effective instructions
5. **Handle edge cases** - Prepare for various scenarios

---

<div align="center">

**Tips for Success:**

- Start with **simple agents**
- Use **clear instructions**
- **Monitor** context usage
- **Clear** sessions when done
- **Keep teams small** (3-5 agents)

</div>