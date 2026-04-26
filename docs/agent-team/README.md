# 🤖 Alloy Agent Team - Comprehensive Documentation

<div align="center">

**Alloy Agent Team** - A sophisticated multi-agent orchestration system with dispatcher-only architecture and specialized specialist agents.

![Agent Team Status](https://img.shields.io/badge/status-production-ready-brightgreen)
![Agents](https://img.shields.io/badge/agents-ready-blue)
![Architecture](https://img.shields.io/badge/architecture-dispacher-worker-orange)

</div>

---

## 🎯 Executive Summary

The Alloy Agent Team is a **dispatcher-only orchestration system** that coordinates specialist agents to accomplish complex tasks. The primary agent has **NO direct codebase access** and can **ONLY delegate work** to specialist agents via the `dispatch_agent` tool.

### Key Features
- ✅ **Dispatcher-Worker Pattern** - Central orchestrator delegates to specialists
- ✅ **Session Persistence** - Each agent maintains its own Pi session for cross-invocation memory
- ✅ **Team-Based Orchestration** - YAML-defined teams with member management
- ✅ **TUI Dashboard** - Real-time status, tool usage, and timing visualization
- ✅ **Validation & Safety** - Pre-dispatch validation, context tracking, error recovery
- ✅ **Flexible Switching** - Agent switching with state management and session preservation

### Project Structure
```
.agent-team/
├── README.md                      # This file
├── IMPLEMENTATION-GUIDE.md        # Architecture and design
├── API-REFERENCE.md               # Complete API documentation
├── USAGE-GUIDE.md                 # User-facing usage instructions
├── CONFIGURATION.md               # Configuration options
├── TROUBLESHOOTING.md             # Common issues and solutions
├── MIGRATION.md                   # From agent-team.ts to agent-team.ts
└── examples/
    └── agent-teams.yaml           # Sample team configurations
```

---

## 🚀 Quick Start Guide

### Installation

```bash
# The agent team is built into the pi system
cd /path/to/piwithstuff

# Enable the agent team extension
pi -e extensions/agent-team.ts
```

### First Steps

1. **Create Agent Definitions** - Add `.md` files with frontmatter to designated directories:
   - `agents/` - Main agent directory
   - `.pi/agents/` - Pi-specific agents
   - `.claude/agents/` - Claude-specific agents

2. **Define Teams** - Create `.pi/agents/teams.yaml`:
   ```yaml
   research:
     - scout
     - analyst
   engineering:
     - coder
     - reviewer
   ```

3. **Switch Teams** - Use the `/agents-team` command:
   ```
   /agents-team          — Select a team to work with
   /agents-list          — List loaded agents
   /agents-grid N        — Set column count (default 2)
   ```

### Example: Creating Your First Agent

**File:** `.pi/agents/scout.md`
```yaml
---
name: scout
description: Explore the codebase and gather information
models: openrouter/google/gemini-3-flash-preview
tools: read,write,edit,bash,grep,find,ls
---
You are the scout agent. Your objective is to explore files, gather information, and provide context. You are precise, minimal, and disciplined.

## MISSION: Information Gathering
You MUST generate actual findings in physical files. Do not just present text in chat.

## Mandatory Protocol
1. Scout files using read, grep, find commands
2. Document findings in .md files
3. Report context percentage usage
4. [SIGNAL_COMPLETE] when finished
```

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Agent Types](#agent-types)
- [Team Management](#team-management)
- [Commands Reference](#commands-reference)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Core Components

#### 1. Dispatcher Agent (Primary)
- **No direct codebase tools**
- **Only `dispatch_agent` tool available**
- **Coordinates specialist agents**
- **Breaks tasks into sub-tasks**
- **Routes to appropriate team members**

#### 2. Specialist Agents
- **Maintain own Pi sessions**
- **Cross-invocation memory**
- **Tool-specific expertise**
- **Session persistence**

#### 3. Team Manager
- **YAML-based team definitions**
- **Dynamic agent loading**
- **Status tracking and visualization**
- **Tool permission management**

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Primary Agent (Dispatcher)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  /no direct code tools, ONLY dispatch_agent         │ │
│  └────────────────────────────────────────────────────┘ │
│                    │                                       │
│                    │ dispatch_agent                        │
│                    ▼                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Team Manager & Orchestrator             │ │
│  │  - Team selection dialog                             │ │
│  │  - Agent state management                            │ │
│  │  - Permission validation                             │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
  ┌──────────────────────────────────────────────────┐
  │             Specialist Agent Pool                   │
  │  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
  │  │ scout   │ │ builder │ │ coder   │ ...          │
  │  └─────────┘ └─────────┘ └─────────┘              │
  │    │           │           │                       │
  │    └───────────┴───────────┘                       │
  └──────────────────────────────────────────────────┘
```

### State Management

- **Agent State**: `Map<string, AgentState>`
- **Session Files**: `.pi/agent-sessions/{agent-name}.json`
- **Team Selection**: `.pi/agents/teams.yaml`
- **Agent Discovery**: Scans `agents/`, `.pi/agents/`, `.claude/agents/`

---

## 🎭 Agent Types

### Universal Agent Template

All agents follow the standard template:

```yaml
---
name: [AGENT_NAME]
description: [SHORT_DESCRIPTION]
models: [MODEL_SPECIFICATION]
tools: [read,write,edit,bash,grep,find,ls]
---
You are the [AGENT_NAME] agent. Your objective is [CORE_MISSION].
## MISSION: [SPECIFIC_TASKS]
## Mandatory Operational Protocol
[OPERATIONAL_PROTOCOLS]
## Strict Edit Protocol
[EDITION_RULES]
## Termination Protocol
[SIGNAL_COMPLETE]
```

### Built-in Agents

1. **scout** - Exploration and information gathering
2. **builder** - Content creation and file generation
3. **coder** - Code implementation and refactoring
4. **reviewer** - Code review and validation
5. **documenter** - Documentation generation

---

## 👥 Team Management

### Creating Teams

**File:** `.pi/agents/teams.yaml`
```yaml
# Team definitions - each team name is a category
research-team:
  - scout
  - analyst
  - researcher

development-team:
  - coder
  - coder-reviewer
  - tester
  - archivist

operations-team:
  - monitor
  - maintainer
  - deployer
```

### Loading Teams

Teams are automatically loaded from `.pi/agents/teams.yaml`:
- **Line-based YAML parsing** - Team name followed by member list
- **Case-insensitive agent names** - Normalized to lowercase
- **First team activated** - Defaults to first team or "all"

### Team Switching

```
/agents-team  — Switch active team
/agents-list  — List loaded agents
```

### Team Isolation

- Each team has its own set of available agents
- Dispatcher only accesses team members
- Team members don't know about other teams
- Prevents scope creep and unauthorized access

---

## 💻 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/agents-team` | Select active team | Shows team selection dialog |
| `/agents-list` | List all agents | Shows agent status |
| `/agents-grid N` | Set widget columns | `/agents-grid 4` for 4-col grid |

---

## 🛠️ API Reference

### Core Classes

#### `AgentTeamManager`

```typescript
class AgentTeamManager {
  constructor(
    config: AgentTeamConfig,
    agentList: Agent[],
    permissions: AgentPermissions,
    switchValidator?: AgentSwitchValidator,
  );
  
  getState(): AgentSwitchState;
  validateSwitch(toolExecutionData: any, targetAgentId?: string): ValidationResult;
}
```

#### `AgentState`

```typescript
interface AgentState {
  def: AgentDef;
  status: "idle" | "running" | "done" | "error";
  task: string;
  toolCount: number;
  elapsed: number;
  lastWork: string;
  contextPct: number;
  sessionFile: string | null;
  runCount: number;
  activeTools: Set<string>;
  lastThinking: string;
}
```

#### `AgentDef`

```typescript
interface AgentDef {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  file: string;
}
```

### Tool Reference

#### `dispatch_agent`

Dispatches a task to a specialist agent.

**Parameters:**
```typescript
{
  agent: string,    // Agent name (case-insensitive)
  task: string      // Task description
}
```

**Returns:**
```typescript
{
  output: string,
  exitCode: number,
  elapsed: number,
}
```

---

## ⚙️ Configuration Options

### Agent Definitions

```yaml
name: agent-name
description: What this agent does
models: model-specification
tools: comma-separated-list
systemPrompt: System prompt text
file: Absolute or relative path
sessionFile: .pi/agent-sessions/name.json
```

### Team Configuration

```yaml
team-name:
  - member1
  - member2
  - member3
```

### Session Configuration

```yaml
# .pi/agent-sessions/.config.yaml
enabled: true
maxEvents: 100
rotation:
  maxSize: 104857600  # 100MB
summaryInterval: 60000 # 60s
autoSummarize: true
```

---

## 📖 Examples

### Example 1: Multi-Step Research Task

```typescript
// Research task example
Task: "Analyze project structure and document findings"

// Dispatcher breaks into:
// 1. scout agent: Explore and map project
// 2. analyst agent: Analyze files
// 3. documenter agent: Create documentation
```

### Example 2: Code Review Workflow

```typescript
// Code review workflow
Task: "Review and refactor utils/helpers.ts"

// Dispatcher routes:
// 1. coder agent: Initial review
// 2. coder-reviewer: Code quality check
// 3. archivist: Update changelog
```

### Example 3: Agent State in Widget

```
● Scout   · 3s · 1 tool · [##--- ] 30%
├─ Builder · 12s · 2 tools · [####- ] 80%
├─ Reviewer · 8s · 1 tool · [###-- ] 60%
└─ Archivist · 5s · 0 tools · thinking...
```

---

## 📚 Best Practices

### Agent Definition Guidelines

1. **Name** - Use clear, descriptive names
2. **Description** - One-line functional description
3. **Tools** - Only list needed tools
4. **Prompt** - Include operational protocols
5. **Context** - Be explicit about limitations

### Team Organization

1. **Separation of Concerns** - Group by function
2. **Clear Boundaries** - No overlap between teams
3. **Purpose Documentation** - Comment team YAML files

### Task Design

1. **One Clear Objective** - Per dispatch
2. **Focused Scope** - Don't over-scoped tasks
3. **Tool Matching** - Choose right agent for tools

---

## 🐛 Troubleshooting

### Common Issues

**Agent Not Found**
- Check agent name spelling
- Verify agent files in correct directory
- Run `/agents-list` to see loaded agents

**No Teams Defined**
- Check `.pi/agents/teams.yaml` exists
- Verify YAML syntax and member names
- Create at least one team

**Persistent Error**
- Check `.pi/agent-sessions/*.log`
- Review `stderr` output
- Try restarting the session

### Debug Workflow

```bash
# List all agents
pi -e extensions/agent-team.ts /agents-list

# Toggle team
pi -e extensions/agent-team.ts /agents-team

# View session
cat .pi/agent-sessions/your-agent.json
```

---

## 🔧 Migration Guide

### From agent-team.ts to Alloy

**Breaking Changes:**
- Agent state now stored in session files
- Teams defined in YAML format
- Dispatcher-only architecture

**Migration Steps:**

1. **Update agent definitions:**
   - Convert `.md` files to frontmatter format
   - Use standard agent templates

2. **Create teams.yaml:**
   - Define teams in `.pi/agents/teams.yaml`
   - List members under team names

3. **Update dispatch logic:**
   - Use validated parameters
   - Handle session file paths
   - Respect team boundaries

4. **Test thoroughly:**
   - Verify team switching
   - Check agent loading
   - Validate tool permissions

---

## 📈 Roadmap

### Phase 1: Core Features (Complete) ✅
- Team management ✅
- Agent state tracking ✅
- Dispatcher-only architecture ✅
- Session persistence ✅

### Phase 2: Enhancements (In Progress)
- [ ] Advanced permission system
- [ ] Multi-team projects
- [ ] Enhanced validation
- [ ] Better error recovery

### Phase 3: Future Features (Planned)
- [ ] Auto-agent discovery
- [ ] Team auto-balancing
- [ ] Cross-team collaboration
- [ ] Analytics dashboard

---

## 📞 Support

### Getting Help

- **GitHub Issues:** Report bugs and feature requests
- **Team Channel:** Discuss with team members
- **Standup Meetings:** Attend team syncs

### Contributing

Contributions welcome! See CONTRIBUTING.md for guidelines.

---

## 📜 License

MIT License - See LICENSE file for details.

---

<div align="center">

**Thank you for using Alloy Agent Team!**

_Built for efficient multi-agent orchestration and specialist collaboration_

</div>