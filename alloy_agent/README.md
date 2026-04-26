# Alloy Agent Team

A multi-agent system with specialized agents for system development tasks.

## Overview

The Alloy Agent Team consists of specialized agents that collaborate to system tasks:

- **Architect**: Designs system architecture
- **Builder**: Implements architecture designs
- **Scanner**: Discovers system components
- **Tester**: Validates builds and reports issues

## Quick Start

```bash
# Start application
mix run lib/alloy_agent.ex

# Access agents
AlloyAgent.Registry.lookup("architect")
```

## Modules

- `AlloyAgent.Memory` - Memory management
- `AlloyAgent.State` - State tracking
- `AlloyAgent.Session` - Session management
- `AlloyAgent.Definition` - Agent definitions
- `AlloyAgent.Registry` - Agent registry
- `AlloyAgent.Dispatcher` - Task dispatching
- `AlloyAgent.Tools` - Tool management
- `AlloyAgent.Supervisor` - Process supervision

## Configuration

See `config/config.exs` for setup.

## Available Tools

- `read` - Read files
- `write` - Write files
- `ls` - List directories
- `find` - Find files
- `grep` - Search content
- `bash` - Run shell commands
- `edit` - Edit files

## License

MIT
