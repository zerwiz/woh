# ⚙️ Alloy Agent Team - Configuration Guide

Complete reference for configuring agent teams, sessions, and system settings.

---

## 📋 Table of Contents

- [Agent Definition Format](#agent-definition-format)
- [Team Configuration](#team-configuration)
- [Session Management](#session-management)
- [Tool Permissions](#tool-permissions)
- [Widget Settings](#widget-settings)
- [Environment Variables](#environment-variables)
- [Validation Rules](#validation-rules)
- [File Structure](#file-structure)

---

## 📝 Agent Definition Format

### Frontmatter Schema

```yaml
---
name: [Unique Agent Name]        # Required
description: [Brief Description]  # Optional
models: [Model Specification]     # Optional
tools: [Comma-Separated List]     # Optional
sessionFile: [Path]              # Optional
---
[Agent System Prompt and Protocols]
```

### Valid Values

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `name` | string | Yes | `scout`, `coder` |
| `description` | string | No | Gathers information, implements code |
| `models` | string | No | `llama-3.1-8b`, `openrouter/google/*` |
| `tools` | string | No | `read,write,edit,bash` |
| `sessionFile` | path | No | `.pi/agent-sessions/coder.json` |

### Example Agent Definition

```yaml
---
name: analyst
description: Analyze files and extract insights
models: llama-3.1-8b
tools: read,write,edit,bash,grep
---
You are the analyst agent. Your objective is code analysis.
## MISSION: File Analysis
You MUST generate actual findings in physical files.

## Protocol
1. Read files using read command
2. Grep for patterns
3. Document findings
4. [SIGNAL_COMPLETE] when done
```

---

## 👥 Team Configuration

### teams.yaml Format

**File:** `.pi/agents/teams.yaml`

```yaml
# Comment lines start with #
# Blank lines are ignored

# Team definitions - each key is a team name
research:
  - scout
  - analyst
  - researcher

development:
  - coder
  - coder-reviewer
  - tester
  - archivist

operations:
  - monitor
  - maintainer
  - deployer
```

### Team Parsing Rules

1. **Key** = Team name (case-insensitive)
2. **Value** = List of member agent names
3. **Empty teams** = Default "all" team
4. **Invalid member** = Silently ignored

### Validation

```yaml
# Valid
team-one:
  - agent-a
  - agent-b

# Invalid - ignored silently
invalid-team:
  - non-existent-agent

# Valid - empty team
empty-team:

# All agents loaded, default team = "all"
```

---

## 🗂️ Session Management

### Session Directory

**Path:** `.pi/agent-sessions/`

**Structure:**
```
.pi/agent-sessions/
├── agent-name-12345.json      # Original state
└── agent-name-history.md      # Conversation history
```

### Session File Format

```json
{
  "agentName": "scout",
  "state": {
    "status": "idle",
    "task": "",
    "elapsed": 0,
    "lastWork": "",
    "toolCount": 0,
    "contextPct": 0,
    "sessionFile": ".pi/agent-sessions/scout.json",
    "runCount": 1,
    "activeTools": [],
    "lastThinking": ""
  }
}
```

### Session States

- **idle** - Waiting for task
- **running** - Executing task
- **done** - Task completed
- **error** - Task failed

### Session Lifecycle

```
1. Init: Create session file
2. Dispatch: Save before task
3. Running: Track progress
4. Complete: Save result
5. Cleanup: Remove on clear
```

---

## 🔧 Tool Permissions

### Tool Availability

**Agents declare** available tools in frontmatter:

```yaml
tools: read,write,edit,bash,grep,find,ls
```

### Default Tools

If not specified, defaults to:
- `read,write,edit,bash,grep,find,ls`

### Permission Validation

**Before dispatch:**
```typescript
function validatePermissions(agentName, requestedTool) {
  const agent = agentMap.get(agentName);
  return agent.tools.split(',').includes(requestedTool);
}
```

### Tool Execution Tracking

**Widget displays:**
- Currently used tools
- Time spent on each tool
- Tool count summary

---

## 🎨 Widget Settings

### Widget Configuration

**File:** `.pi/ui/themeMap.ts` (or similar)

```typescript
const theme = {
  fg: (color: string, text: string) => text,
  bold: (text: string) => text,
  accent: (text: string) => text,
  muted: (text: string) => text,
  dim: (text: string) => text,
  error: (text: string) => text,
  success: (text: string) => text,
  toolTitle: (text: string) => text,
  italic: (text: string) => text,
};
```

### Widget Commands

```bash
/agents-grid N    # Set column count
```

**Valid values:** 1-10
**Default:** 2

### Footer Display

```typescript
{
  model: "llama-3.1-8b",
  team: "research",
  context: [████░░] 30%
}
```

---

## 🔐 Environment Variables

### Configuration Options

```bash
# Model path
export MODEL_PATH=./models

# API key (empty for local)
export API_KEY=""

# Session directory
export SESSION_DIR=.pi/agent-sessions

# Team directory
export TEAMS_DIR=.pi/agents
```

### Example .env File

```bash
# Model configuration
MODEL_PATH=./models
MODEL_ID=llama-3.1-8b

# API configuration
API_KEY=

# Session settings
SESSION_DIR=.pi/agent-sessions
MAX_SESSION_SIZE=104857600

# Team settings
TEAMS_DIR=.pi/agents
DEFAULT_TEAM=research

# UI settings
WIDGET_ROWS=20
WIDGET_COLS=80
```

---

## ⚠️ Validation Rules

### Agent Name Validation

**Must:**
- Be unique across all environments
- Follow naming convention (noun, not verb)
- Be lowercase for simplicity

**Pattern:**
```regex
^[a-z][a-z0-9]*$
```

**Examples:**
- ✅ `scout`, `coder`, `reviewer`
- ✅ `agent-one`, `project-leader`
- ❌ `Agent`, `Scout`, `searcher1`

### Team Name Validation

**Rules:**
- Alphanumeric and hyphenation
- No reserved words
- Case-insensitive

**Pattern:**
```regex
^[a-z0-9][a-z0-9-]*$
```

### Tool Name Validation

**Built-in tools only:**
- `read`, `write`, `edit`, `bash`
- `grep`, `find`, `ls`, `edit`, `read`

**Invalid tools:**
- `custom-tool` (unless registered)
- `-bash` (with leading hyphen)
- Uppercase names

---

## 🗂️ File Structure

### Recommended Layout

```
project/
├── .pi/
│   └── agents/
│       ├── teams.yaml
│       ├── searcher.md
│       ├── reader.md
│       └── indexer.md
├── .claude/
│   └── agents/
│       ├── researcher.md
│       └── analyzer.md
├── agents/
│   ├── explorer.md
│   └── writer.md
└── scripts/
    ├── setup-teams.sh
    └── deploy-agents.sh
```

### Directory Purpose

- **`.pi/agents/`** - Primary agent definitions
- **`.claude/agents/`** - Claude-specific agents
- **`agents/`** - Generic agent definitions
- **`.pi/agent-sessions/`** - Session state files (auto-created)

### teams.yaml Templates

**Basic (single team):**
```yaml
default-team:
  - agent-1
  - agent-2
```

**Multi-team:**
```yaml
research:
  - scout
  - analyst

dev:
  - coder
  - reviewer

ops:
  - monitor
  - maintainer
```

---

## 🔍 Troubleshooting Config

### Common Errors

**"No agents loaded"**
- Check agent files in correct directories
- Verify frontmatter syntax
- Ensure `.md` extension

**"Agent not found"**
- Check name spelling (case-insensitive)
- Verify team.yaml references
- Run `/agents-list` to see loaded agents

**"Team not defined"**
- Check teams.yaml syntax
- Look for typos
- Empty team = default "all"

**"Permission denied"**
- Verify tool availability
- Check agent declares needed tools
- Review team permissions

---

## 📊 Monitoring Configuration

### Session File Rotation

**Config in:** `.pi/agent-sessions/.config.yaml`

```yaml
enabled: true
maxEvents: 100
rotation:
  maxSize: 104857600      # 100MB
  summaryInterval: 60000  # 60s
autoSummarize: true
```

### Widget Update Rate

**Default:** 80ms per frame

**Modify:**
```typescript
globalInterval = setInterval(updateWidget, 80);
// Change to:
globalInterval = setInterval(updateWidget, 100);
```

---

## 🎯 Migration Checklist

### From Legacy to Alloy

- ☐ Copy agent definitions to new directories
- ☐ Create teams.yaml file
- ☐ Define team memberships
- ☐ Clear old sessions (.pi/agent-sessions)
- ☐ Test team switching
- ☐ Verify agent loading
- ☐ Check tool permissions
- ☐ Validate prompts work

### Configuration Comparison

| Setting | Legacy | Alloy |
|---------|--------|-------|
| Agent files | Anywhere | Specific dirs |
| Teams | Hardcoded | YAML file |
| Sessions | None | Session files |
| Permissions | All allowed | Tool validation |

---

<div align="center">

**Configuration Reference Complete**

_Consider your setup and optimize for your workflow_

</div>