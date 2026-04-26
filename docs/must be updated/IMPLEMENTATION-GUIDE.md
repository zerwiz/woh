# 🏗️ Alloy Agent Team - Implementation Guide

This guide covers the architecture, design decisions, and implementation details of the Alloy Agent Team system.

---

## 🎯 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Design Decisions](#design-decisions)
- [Component Details](#component-details)
- [State Management](#state-management)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)

---

## 🏛️ Architecture Overview

### Design Pattern: Dispatcher-Worker

The Alloy Agent Team follows the **Dispatcher-Worker Pattern**:

```
┌───────────────┐         ┌────────────────┐
│   Dispatcher  │ ───────▶│   Specialist    │
│   (Primary)   │         │    Agents       │
└───────────────┘         └────────────────┘
       │                           │
       │ delegate tasks            │ handle execution
       ▼                           ▼
  [No code tools]           [Maintain own sessions]
```

### Key Responsibilities

#### Dispatcher (Primary Agent)
- **NO** direct codebase access
- **ONLY** `dispatch_agent` tool
- Orchestrates work through specialists
- Breaks complex tasks into sub-tasks
- Routes to appropriate team members

#### Specialist Agents
- Maintain their own Pi sessions
- Have context window for cross-invocation memory
- Focus on specific expertise areas
- Execute delegated tasks

### Message Flow

```
User Command ──▶ Dispatcher
       │
       ▼
  Validates Request
       │
       ▼
  Selects Team
       │
       ▼
  Routes to Specialist
       │
       ▼
  Specialist Executes
       │
       ▼
  Returns Result
       │
       ▼
  Dispatcher Synthesizes
       │
       ▼
  Returns to User
```

---

## 💭 Design Decisions

### Decision 1: Dispatcher-Only Architecture

**Rationale:**
- Prevents security issues (no unauthorized code access)
- Forces explicit task delegation
- Provides clear audit trail
- Enables team-based workflows

**Alternatives Considered:**
- Full agent access - less secure
- Restricted specific tools - more complex
- Current choice: balance of safety and flexibility

**Trade-offs:**
- ✅ Enhanced security
- ✅ Clear separation of concerns
- ❌ Slightly higher latency (two hops)
- ✅ Solves "who does what" ambiguity

### Decision 2: Session Persistence per Agent

**Rationale:**
- Each agent has its own context window
- State survives across invocations
- Agents resume from last position

**Implementation:**
```typescript
interface AgentState {
  sessionFile: string | null;
  lastWork: string;
  runCount: number;
}
```

**Benefits:**
- Agents don't repeat work
- Complex multi-step tasks possible
- State recovery on crash

### Decision 3: YAML Team Definitions

**Rationale:**
- Simple, human-readable
- Easy to maintain
- Team selection via CLI

**Format:**
```yaml
team-name:
  - agent1
  - agent2
  - agent3
```

**Advantages:**
- Quick team reorganization
- Team isolation enforcement
- Clear visibility of team composition

### Decision 4: Frontmatter-based Agent Definitions

**Rationale:**
- YAML frontmatter with body content
- Metadata from frontmatter
- Instructions from body
- Flexible extension

**Example:**
```yaml
---
name: coder
description: Code implementation
tools: read,write,edit,bash,...
---
[Agent instructions and protocols]
```

---

## 🧩 Component Details

### Core Modules

#### 1. Agent Discovery Module

**Location:** `agent-team.ts` (lines 100-150)

**Responsibilities:**
- Scan agent directories
- Parse agent definitions
- Load teams from YAML
- Manage agent state map

**Algorithm:**
```typescript
function scanAgentDirs(cwd: string): AgentDef[] {
  const dirs = [
    join(cwd, "agents"),
    join(cwd, ".claude", "agents"),
    join(cwd, ".pi", "agents"),
  ];

  const agents: AgentDef[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    // ... parse each agent file
  }

  return agents;
}
```

#### 2. Team Management Module

**Location:** `agent-team.ts` (lines 150-200)

**Functions:**
- `parseTeamsYaml()`: Parse team definitions
- `activateTeam()`: Set active team
- `renderAgentLine()`: Widget rendering

**State Management:**
```typescript
const agentStates: Map<string, AgentState> = new Map();
let activeTeamName = "";
let teams: Record<string, string[]> = {};
```

#### 3. Dispatch Agent Module

**Location:** `agent-team.ts` (lines 250-400)

**Key Functions:**
- `dispatchAgent()`: Execute agent task
- Handle streaming output
- Track time and tool usage
- Manage agent lifecycle

**Streaming Handler:**
```typescript
proc.stdout!.on("data", (chunk: string) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    // Parse event and update state
  }
});
```

### UI/Widget Module

**Location:** `agent-team.ts` (lines 300-380)

**Widget Lifecycle:**
```typescript
updateWidget() {
  if (!widgetCtx) return;
  
  widgetCtx.ui.setWidget("agent-team", (_tui, theme) => ({
    render: (width) => {
      // Render agent list grid
    },
    invalidate: () => {},
  }));
}
```

**Rendering Pipeline:**
1. Create widget context
2. Set 80ms interval timer
3. Render agent status
4. Handle streaming updates
5. Clear on team switch

---

## 🔄 State Management

### Agent State Machine

```
┌─────────────┐
│   IDLE      │───────┐
└─────────────┘       │
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│  RUNNING    │▶│   DONE      │
└─────────────┘└─────────────┘
       │
       ▼
┌─────────────┐
│   ERROR     │◀
└─────────────┘
```

### State Transitions

| Event | From | To | Action |
|-------|------|----|--------|
| Task queued | IDLE | RUNNING | Clear state, start timer |
| Task completes | RUNNING | DONE | Save session, stop timer |
| Task fails | RUNNING | ERROR | Log error, clear tools |
| Team switch | Any | IDLE | Clear all states |

### Session File Structure

```json
{
  "agentName": "scout",
  "state": {
    "status": "idle",
    "task": "",
    "elapsed": 0
  }
}
```

---

## 🔐 Security Considerations

### Command Injection Prevention

**Validation:**
```typescript
const sanitizedTask = task.trim();
if (sanitizedTask.startsWith("-")) {
  return error("Cannot start with hyphen");
}
```

**Tool Permission Check:**
```typescript
if (!this.canSwitchToAgent(targetAgentId)) {
  return validationFailed("No permission");
}
```

### Context Window Enforcement

**Usage Tracking:**
```typescript
state.contextPct = ((msg.usage.input || 0) / contextWindow) * 100;
```

**Limit:**
- No single agent exceeds context window
- Prevents accidental overflow
- Monitors usage percentage

### File Access Control

**Session Directory:**
```typescript
const sessionDir = join(cwd, ".pi", "agent-sessions");
if (!existsSync(sessionDir)) {
  mkdirSync(sessionDir, { recursive: true });
}
```

**Isolation:**
- `.pi/agent-sessions/` isolated from user files
- Per-agent session files
- Read-only logs

---

## ⚡ Performance Optimization

### Widget Performance

**Optimization 1: Conditional Rendering**
```typescript
function updateWidget() {
  if (!widgetCtx) return;
  // Only update when needed
}
```

**Optimization 2: Efficient State Updates**
```typescript
widgetFrame++;
updateWidget(); // Runs every 80ms
```

**Optimization 3: Lazy Loading**
```typescript
function ensureGlobalInterval() {
  if (globalInterval) return;
  globalInterval = setInterval(updateWidget, 80);
}
```

### Memory Management

**Session Cleanup:**
```typescript
if (existsSync(sessDir)) {
  for (const f of readdirSync(sessDir)) {
    try { unlinkSync(join(sessDir, f)); } catch {}
  }
}
```

**Tool Set Operations:**
```typescript
state.activeTools.add(name);  // O(1)
state.activeTools.delete(name); // O(1)
```

### Streaming Efficiency

**Buffer Management:**
```typescript
let buffer = "";
proc.stdout!.on("data", (chunk: string) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Keep last line for next chunk
});
```

---

## 🧪 Testing Strategy

### Unit Tests

**Agent State Transitions:**
```typescript
describe("AgentState transitions", () => {
  it("transitions from IDLE to RUNNING", () => {
    // ... test
  });
  
  it("handles tool execution", () => {
    // ... test
  });
});
```

### Integration Tests

**Multi-Agent Workflows:**
```typescript
describe("Multi-agent collaboration", () => {
  it("dispatcher routes to specialist", () => {
    // ... test
  });
  
  it("handles team switching", () => {
    // ... test
  });
});
```

### Performance Tests

**Widget Rendering:**
```typescript
it("renders under 100ms with 10+ agents", () => {
  // ... benchmark
});
```

**Memory Usage:**
```typescript
it("stays under 500MB", () => {
  // ... memory check
});
```

---

## 🚀 Deployment

### Pre-Flight Checks

1. **Agent Files Present**
   - Check `agents/`, `.pi/agents/` directories
   - Verify `.md` files with valid frontmatter

2. **Teams Configuration**
   - Check `.pi/agents/teams.yaml`
   - Verify YAML syntax

3. **Permissions**
   - Review team permissions
   - Validate tool assignments

### Post-Deployment Validation

```bash
# List teams
pi -e extensions/agent-team.ts /agents-team

# List agencies
pi -e extensions/agent-team.ts /agents-list

# Verify widget
pi -e extensions/agent-team.ts
```

### Rollback Procedure

1. **Disable Extension:**
   ```bash
   pi -e extensions/agent-team.ts --disable
   ```

2. **Restore Previous Version:**
   ```bash
   git checkout -- extensions/agent-team.ts
   ```

3. **Clear State:**
   ```bash
   rm -rf .pi/agent-sessions/
   ```

---

## 📊 Monitoring & Debugging

### Debug Commands

```bash
# View agent state
cat .pi/agent-sessions/scout.json

# Check active team
pi -e extensions/agent-team.ts /agents-list

# Force widget update
pi -e extensions/agent-team.ts /agents-grid
```

### Performance Metrics

**Widget Update Rate:**
- Target: 80ms per update
- Acceptable: 100-120ms
- Warning: > 200ms

**Memory Usage:**
- Target: < 500MB
- Acceptable: 500-800MB
- Warning: > 800MB

**Session File Size:**
- Max: 100MB per agent
- Rotation: Auto-enabled
- Cleanup: On session end

---

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Permissions:**
   - Role-based access control
   - Dynamic permission updates

2. **Auto-Discovery:**
   - Register agents dynamically
   - Health checking

3. **Analytics:**
   - Agent performance metrics
   - Team efficiency tracking

4. **Cross-Team Collaboration:**
   - Team-based dispatch
   - Inter-service calls

---

<div align="center">

**End of Implementation Guide**

_Built for sophisticated multi-agent orchestration_

</div>