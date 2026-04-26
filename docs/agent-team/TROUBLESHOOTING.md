# 🛠️ Alloy Agent Team - Troubleshooting Guide

<div align="center">

**Common issues and solutions**

_Produced by Alloy Team Documentation_

</div>

---

## 🎯 Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Agent Loading Issues](#agent-loading-issues)
- [Team Management Issues](#team-management-issues)
- [Session Problems](#session-problems)
- [Widget Problems](#widget-problems)
- [Tool Execution Failures](#tool-execution-failures)
- [Performance Issues](#performance-issues)
- [Security Warnings](#security-warnings)
- [Getting Support](#getting-support)

---

## 🔍 Quick Diagnosis

### Step 1: Check Extension Loaded

```bash
# Verify extension is loaded
pi -e extensions/agent-team.ts

# List loaded commands
pi /agents-team
```

### Step 2: Check Agent Files

```bash
# List agent directories
ls .pi/agents
ls agents
ls .claude/agents

# Check for valid .md files
find . -name "*.md" | grep -i agent
```

### Step 3: Check Team File

```bash
# View team configuration
cat .pi/agents/teams.yaml

# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('.pi/agents/teams.yaml'))"
```

### Step 4: List Agents

```bash
# Command to list all loaded agents
pi -e extensions/agent-team.ts /agents-list
```

---

## 📦 Agent Loading Issues

### Error: "No agents found"

**Symptoms:**
```
/agents-team
No agents found. Add .md files to agents/
```

**Solutions:**

1. **Add agent files:**
   ```
   .pi/agents/
   └── searcher.md      # Must exist
   ```

2. **Verify frontmatter:**
   ```yaml
   # Valid agent definition
   ---
   name: searcher
   description: Search files
   tools: read,write
   ---
   [Agent body content]
   ```

3. **Check directory paths:**
   - `.pi/agents/`
   - `agents/`
   - `.claude/agents/`

### Error: "Agent 'X' not found"

**Symptoms:**
```
Agent "scout" not found. Available: ...
```

**Solutions:**

1. **Check spelling:**
   - Agent names are case-insensitive
   - Check name in team.yaml matches agent file name

2. **Verify file exists:**
   ```bash
   ls .pi/agents/scout.md
   ```

3. **Clear and reload:**
   ```bash
   rm .pi/agent-sessions/scout.json
   pi -e extensions/agent-team.ts
   ```

### Error: "Invalid frontmatter"

**Symptoms:**
```
Failed to parse agent file
```

**Solutions:**

1. **Check YAML syntax:**
   ```yaml
   ---
   name: scout      # Must be indented correctly
   description: ...
   models: ...
   ---
   ...
   ```

2. **No trailing whitespace:**
   ```yaml
   ---
   name: scout
   
   [Correct]
   ```

3. **Minimize indentation:**
   ```yaml
   ---
   name: scout
  
   ```

---

## 👥 Team Management Issues

### Error: "Team 'X' not defined"

**Symptoms:**
```
Team "research" not found
```

**Solutions:**

1. **Create teams.yaml:**
   ```yaml
   # .pi/agents/teams.yaml
   research:
     - scout
     - analyst
   
   default-team:
     - coder
   ```

2. **Check YAML syntax:**
   ```bash
   # Validate YAML
   python -c "import yaml; print(yaml.safe_load(open('.pi/agents/teams.yaml')))"
   ```

3. **Verify team name:**
   ```bash
   # List available teams
   teamNames = Object.keys(teams)
   ```

### Error: "Invalid team member"

**Symptoms:**
```
Team "dev" member "coder" not found
```

**Solutions:**

1. **Check member name:**
   - Must match agent definitions exactly
   - Case-insensitive but still verify

2. **Verify agent exists:**
   ```bash
   ls .pi/agents/coder.md
   ```

### Error: "Cannot switch teams"

**Symptoms:**
```
Switch team operation in progress
```

**Solutions:**

1. **Wait for current operation:**
   - May be switching or validating
   - Check status with `/agents-list`

2. **Clear state:**
   ```bash
   pi -e extensions/agent-team.ts /agents-clear
   ```

---

## 💾 Session Problems

### Error: "Session corrupt"

**Symptoms:**
```
Failed to load session
```

**Solutions:**

1. **Delete session file:**
   ```bash
   rm .pi/agent-sessions/agent-name.json
   ```

2. **Restart Pi:**
   ```bash
   # Restart or continue without state
   ```

### Session files growing large

**Symptoms:**
```
Warning: Session size approaching limit
```

**Solutions:**

1. **Check disk space:**
   ```bash
   ls -la .pi/agent-sessions/
   ```

2. **Manually prune:**
   ```bash
   rm .pi/agent-sessions/*.json
   ```

### Session not persisting

**Symptoms:**
```
Agent state lost after restart
```

**Solutions:**

1. **Clear and recreate:**
   ```bash
   # Delete old sessions
   rm -rf .pi/agent-sessions/*
   
   # Start fresh
   pi -e extensions/agent-team.ts
   ```

2. **Configure session retention:**
   ```yaml
   # .pi/agent-sessions/.config.yaml
   autoSummarize: true
   rotation:
     maxSize: 104857600  # 100MB
   ```

---

## 🎨 Widget Problems

### Widget doesn't appear

**Solutions:**

1. **Update widget:**
   ```bash
   pi -e extensions/agent-team.ts
   
   # Or force update
   /agents-grid
   ```

2. **Check widget context:**
   - Ensure `_ctx.ui.setWidget` was called
   - Check for errors in console

### Widget frozen/not updating

**Solutions:**

1. **Clear interval:**
   ```typescript
   if (globalInterval) {
     clearInterval(globalInterval);
     globalInterval = null;
   }
   ```

2. **Restart extension:**
   ```bash
   pi -e extensions/agent-team.ts --reset
   ```

### Widget showing wrong team

**Solutions:**

1. **Switch teams:**
   ```bash
   /agents-team
   ```

2. **Clear and reload:**
   ```bash
   /agents-clear
   ```

---

## 🔧 Tool Execution Failures

### Error: "Cannot dispatch to agent"

**Symptoms:**
```
Agent not found or not in active team
```

**Solutions:**

1. **Check agent exists:**
   ```bash
   /agents-list
   ```

2. **Check team membership:**
   ```bash
   /agents-team
   ```

3. **Verify tool permissions:**
   - Agent must declare tool in frontmatter
   - Example: `tools: read,write,bash`

### Error: "Agent is busy"

**Symptoms:**
```
Agent currently running a task
```

**Solutions:**

1. **Wait for completion:**
   - Agent will finish current task
   - Check widget for status

2. **Clear previous task:**
   ```bash
   # Delete task state
   rm .pi/agent-sessions/agent-task.json
   ```

### Error: "Tool execution failed"

**Solutions:**

1. **Clear agent state:**
   ```bash
   rm .pi/agent-sessions/agent-name.json
   ```

2. **Check tool availability:**
   - Verify tool is declared in agent frontmatter
   - Check tool name matches exactly

---

## ⚡ Performance Issues

### Slow widget updates

**Symptoms:**
```
Widget refresh taking > 200ms
```

**Solutions:**

1. **Fewer agents:**
   - Limit team size
   - Remove unused agents

2. **Optimize interval:**
   ```typescript
   // Increase interval if needed
   setInterval(updateWidget, 100);
   ```

### Memory usage high

**Symptoms:**
```
Memory usage > 500MB
```

**Solutions:**

1. **Clear sessions:**
   ```bash
   rm .pi/agent-sessions/*.json
   ```

2. **Review agent usage:**
   - Remove unused agents
   - Clear completed sessions

### Too many agents

**Solutions:**

1. **Consolidate teams:**
   - Combine related agents
   - Remove duplicate functionality

2. **Archive:**
   - Move unused agents to archive

---

## 🔒 Security Warnings

### Warning: "Command injection risk"

**Symptoms:**
```
Task string contains flags
```

**Solutions:**

1. **Sanitize input:**
   ```bash
   # Don't pass flags in tasks
   Task: "list files"
   # Not: "--help"
   ```

2. **Validate tasks:**
   ```typescript
   if (sanitizedTask.startsWith("-")) {
     return error("Cannot start with hyphen");
   }
   ```

---

## 📞 Getting Support

### Debug Workflow

```bash
# 1. List agents
pi -e extensions/agent-team.ts /agents-list

# 2. Check team status
pi -e extensions/agent-team.ts /agents-team

# 3. View session files
ls -la .pi/agent-sessions/

# 4. Check errors
cat .pi/agent-sessions/*.log
```

### Reporting Issues

**Before reporting:**
1. **Clear sessions** and try again
2. **Check** documentation thoroughly
3. **Try** team switch and clear commands

**Include:**
- Error message
- Steps to reproduce
- Agent definitions
- Team configuration

---

<div align="center">

**Common Commands:**

```bash
# List all agents
pi -e extensions/agent-team.ts /agents-list

# Check teams
pi -e extensions/agent-team.ts /agents-team

# Clear state
pi -e extensions/agent-team.ts /agents-clear

# Set widget columns
pi -e extensions/agent-team.ts /agents-grid 4
```

</div>