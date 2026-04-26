# Eelixir Agent Team TUI Components

A Text User Interface (TUI) component providing real-time visualization and control for the Eelixir agent team.

## Overview

The Eelixir TUI components provide:
- **Real-time agent status display** with animated indicators
- **Tool execution monitoring** with activity descriptions
- **Token and turn counters** for resource tracking
- **Configurable overflow handling** for limited screen space
- **Theme support** for consistent appearance

## File Structure

```
src/ui/eelixir/
├── eelixir-agent-types.ts   # Type definitions
├── eelixir-widget.ts        # TUI widget component
├── eelixir-manager.ts       # Agent team manager
├── eelixir-view.ts          # Main TUI view
├── eelixir-wrapper.ts       # High-level wrapper API
└── README.md                # This file
```

## Quick Start

```typescript
import { EelixirConfig, EelixirView } from "./src/ui/eelixir";

// Configuration
const config: EelixirConfig = {
  teamName: "Eelixir Research Team",
  maxConcurrent: 1,
  allowParallelTools: true,
  toolTimeout: 60000,
  verbose: false,
  displayMode: "compact",
  colors: {
    primary: "#3b82f6",
    success: "#22c55e",
    error: "#ef4444",
  },
};

// Create and initialize view
const view = new EelixirView(config);
view.init(uiCtx);
```

## Features

### Agent Status Indicators

- **Animated spinners** for running agents
- **Status icons**: queued (◦), running (●), completed (✓), error (✗)
- **Real-time activity** descriptions
- **Token counters** with human-readable formatting

### Tool Execution

- Tracks active tools during execution
- Displays tool usage statistics
- Shows execution duration
- Maintains tool result context

### Overflow Handling

- Prioritizes running agents
- Shows queue information
- Summarizes overflow content
- Maintains compact footprint

## Configuration

### EelixirConfig Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| teamName | string | Display name | - |
| maxConcurrent | number | Max running agents | 1 |
| allowParallelTools | boolean | Parallel tool execution | true |
| toolTimeout | number | Tool timeout (ms) | 60000 |
| verbose | boolean | Verbose logging | false |

## API Reference

### EelixirView

Main view class providing TUI integration.

```typescript
const view = new EelixirView(config);

// Initialize with UI context
view.init(uiCtx);

// Handle tool execution
await view.onToolExecutionStart(data);
await view.onToolExecutionEnd(data);

// Handle agent switching
await view.onSwitchIntent(agentId, targetAgentId);

// Get running agent count
const count = view.getRunningAgentCount();
```

### EelixirWidget

Widget for widget-based rendering.

```typescript
const widget = new EelixirWidget(agentMap, config);
widget.setUICtx(uiCtx);
widget.ensureTimer();
const render = widget.render(tui);
```

### EelixirAgentManager

Manager for agent team operations.

```typescript
const manager = new EelixirAgentManager(config);

// Start agent
await manager.startAgent(agentId, maxTurns);

// Stop agent
await manager.stopAgent(agentId);

// Complete agent
await manager.completeAgent(agentId, result);
```

## Compliance

This component follows:
- PI-AGENTS-001: Agent management standards
- PI-TOOLBAR-001: Widget display standards

## Standards

- **Version**: 1.0.0
- **Team**: Eelixir
- **Type**: AgentTeamManager
- **Standards**: PI-AGENTS-001, PI-TOOLBAR-001

## Examples

### Status Display

```typescript
// Render in TUI
const render = view.render(tui);
const lines = render.render();
```

### Handling Tool Execution

```typescript
// On tool execution start
view.onToolExecutionStart({
  toolName: "bash",
  data: "ls -la",
});

// On tool execution complete
await view.onToolExecutionEnd({
  toolName: "bash",
  content: "file1.txt file2.txt",
});
```

### Agent Switching

```typescript
// Switch to target agent
await view.onSwitchIntent(
  "current-agent-id",
  "target-agent-id",
);
```

## License

This component is part of the Eelixir project and follows the same licensing terms.

---

*Made with ❤️ for Eelixir*
