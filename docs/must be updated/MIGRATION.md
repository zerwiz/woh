# 🔀 Alloy Agent Team - Migration Guide

<div align="center">

**Migrating from legacy agent-team to Alloy**

_Comprehensive migration instructions_

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [What Changed](#what-changed)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Step-by-Step Migration](#step-by-step-migration)
- [Validation](#validation)
- [Common Issues](#common-issues)
- [Rollback Procedure](#rollback-procedure)

---

## 🎯 Overview

### Legacy vs Alloy

| Feature | Legacy | Alloy |
|---------|--------|-------|
| Agent locations | Anywhere | Specific directories |
| Team definitions | Hardcoded | YAML files |
| Sessions | None | Session files |
| Permissions | All allowed | Tool validation |
| State | In-memory | Persistent files |

### Architecture Changes

**Before:**
- All agents in one pool
- No team separation
- Simple dispatch

**After:**
- Teams organized by purpose
- Dispatcher-only access
- Session persistence
- Permission validation

---

## 🔄 What Changed

### 1. Agent Definitions

**Before:**
```yaml
# Anywhere in project
name: agent1

# Or anywhere
---
name: agent2

# No structure
```

**After:** `.pi/agents/agent-name.md`
```yaml
---
name: agent-name
description: Brief description
tools: read,write,bash
---
[Agent instructions]
```

### 2. Team Definitions

**Before:**
Defined in code or config files. Teams were hardcoded or managed manually.

**After:**
```yaml
# .pi/agents/teams.yaml
research:
  - scout
  - analyst
  - researcher

development:
  - coder
  - reviewer
  - tester
```

### 3. Session Management

**Before:**
State reset on each session.

**After:**
```json
{
  "agentName": "agent-name",
  "state": {
    "status": "idle",
    "task": "",
    "elapsed": 0
  }
}
```

### 4. Dispatcher Architecture

**Before:**
Dispatcher had all tools.

**After:**
Dispatcher has ONLY `dispatch_agent` tool.
Specialists maintain their own sessions.

---

## ✅ Pre-Migration Checklist

### Files to Backup

```bash
# Backup current agents
cp -r agents/ ~/backup/agents/
cp -r .pi/agents/ ~/backup/.pi/agents/
cp -r .claude/agents/ ~/backup/.claude/agents/

# Backup teams (if exists)
cp -r .pi/agents/teams.yaml ~/backup/teams.yaml
```

### Sessions to Preserve

```bash
# Backup sessions
cp -r .pi/agent-sessions/ ~/backup/agent-sessions/

# Clear old sessions before migration
rm -rf .pi/agent-sessions/*
rm -rf agents-sessions/*
```

### Agent Inventory

```bash
# List current agents
find . -name "*.md" -path "*/agent*" | sort

# Document existing configurations
cat *.yaml > backup-config.txt
```

---

## 🚀 Step-by-Step Migration

### Step 1: Review Existing Agents

```bash
# Find all agent definitions
find . -name "*.md" -exec head -10 {} \;

# Extract agent metadata
grep -r "^name:" --include="*.md" .
```

**Action:**
- Review each agent
- Update frontmatter format
- Add description if missing
- Verify tool listing

### Step 2. Create Teams Configuration

```bash
# Create team file
mkdir -p .pi/agents
touch .pi/agents/teams.yaml
```

**Content:**
```yaml
# Group agents by function
research:
  - agent1
  - agent2

development:
  - agent3
  - agent4
  - agent5
```

### Step 3. Update Agent Files

**For each agent:**

```yaml
# Before:
name: coder
---
You are coder...

# After:
---
name: coder
description: Code implementation and refactoring
tools: read,write,edit,bash,grep,find,ls
sessionFile: .pi/agent-sessions/coder.json
---
You are coder...
```

### Step 4. Organize in Directories

```bash
# Create structured directories
mkdir -p .pi/agents
mkdir -p .claude/agents

# Move agents
cp *.md .pi/agents/
mv *.md .claude/agents/  # If applicable
```

### Step 5. Clear Old State

```bash
# Clear old session files
rm -rf .pi/agent-sessions/*
rm -rf .pi/.*sides/*.json
```

### Step 6. Test Team Loading

```bash
# Load teams
pi -e extensions/agent-team.ts

# Select team
/agents-team
```

### Step 7. Verify Agent Loading

```bash
# List all agents
/agents-list
```

**Expected Output:**
```
Available agents:
- coder (idle, new, runs: 1)
- researcher (idle, new, runs: 0)
- searcher (idle, resumed, runs: 5)
```

### Step 8. Configure Teams

```yaml
# teams.yaml
research:
  - scout
  - analyst
  - researcher

development:
  - coder
  - coder-reviewer
  - tester
```

```bash
# Activate team
/agents-team
```

### Step 9. Clear Invalid State

```bash
# Clear and reload
pi -e extensions/agent-team.ts /agents-clear
```

---

## ⚠️ Validation

### Checklist

After migration, validate:

- [ ] `/agents-list` shows all agents
- [ ] `/agents-team` shows team selection
- [ ] `/agents-grid` renders correctly
- [ ] Team switching works
- [ ] Agent dispatch completes

### Test Cases

**Test 1: Agent Loading**
```bash
# List all agents
pi -e extensions/agent-team.ts /agents-list
```

**Test 2: Team Switching**
```bash
# Switch to team
pi -e extensions/agent-team.ts /agents-team
```

**Test 3: Agent Dispatch**
```bash
# Dispatch task
dispatch_agent:
  agent: search
  task: "Find readme files"
```

---

## 💥 Common Issues

### Issue 1: Agents Not Loading

**Symptoms:**
```
No agents found
```

**Solution:**
```bash
# Check directories
ls .pi/agents/
ls agents/
ls .claude/agents/

# Check file names
find . -name "*.md" -type f

# Verify frontmatter
grep "^name:" *.md
```

### Issue 2: Team Not Found

**Symptoms:**
```
Team "research" not defined
```

**Solution:**
```yaml
# Check .pi/agents/teams.yaml exists
cat .pi/agents/teams.yaml

# Ensure YAML syntax
python -c "import yaml; yaml.safe_load(open('teams.yaml'))"
```

### Issue 3: Session Corruption

**Symptoms:**
```
Failed to load session
```

**Solution:**
```bash
# Clear sessions
rm -rf .pi/agent-sessions/*

# Clear old sessions
rm .pi/.*sides/*.json
```

### Issue 4: Tool Validation Failure

**Symptoms:**
```
No permission to switch
```

**Solution:**
```yaml
# Update agent teams.yaml
# Ensure tool declarations match
tools: read,write,edit,bash
```

---

## 🔄 Rollback Procedure

### If Migration Fails

```bash
# Restore backup
mv ~/backup/agents/ .pi/agents/

# Restore old sessions
mv ~/backup/agent-sessions/ .pi/

# Clear new state
rm -rf .pi/agent-sessions/*
rm -rf .pi/.pidses/*.json
```

### Validate Rollback

```bash
# Verify old configuration works
pi -e extensions/agent-team.ts
/agents-team
```

### Partial Rollback

```bash
# Keep teams.yaml, restore agents
rm -rf .pi/agents/
cp -r ~/backup/agents/ .pi/

# Validate
ls .pi/agents/
```

---

## 📊 Migration Checklist

### Pre-Migration

- [ ] Backup agent files
- [ ] Backup configuration
- [ ] Document existing teams
- [ ] Review all agent definitions

### During Migration

- [ ] Create team file
- [ ] Update agent frontmatter
- [ ] Organize into directories
- [ ] Clear old sessions

### Post-Migration

- [ ] Validate team loading
- [ ] Test team switching
- [ ] Verify agent loading
- [ ] Test agent dispatch

---

<div align="center">

**Migration Complete!**

_Be sure to save your backup and validate the migration_

</div>
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
