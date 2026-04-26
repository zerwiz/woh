# Alloy Agent Implementation Plan

## Vision

Interactive AI coding agent with chat interface like pi.dev, using local Ollama models.

---

## Files Being Used NOW (April 26, 2026)

### MAIN ENTRY POINTS
| File | Purpose |
|------|---------|
| `/home/zerwiz/woh/src/cli-tui.ts` | Interactive chat CLI |
| `/home/zerwiz/woh/src/cli.ts` | Simple CLI (non-interactive) |
| `/home/zerwiz/woh/justfile` | Just commands |

### Core Library (`/home/zerwiz/woh/src/lib/`)
| File | Purpose |
|------|---------|
| `damage-control.ts` | Parse YAML rules |
| `themes.ts` | Theme loader |
| `agents.ts` | Agent loader |
| `modes.ts` | Team/chain configs |
| `memory.ts` | Session persistence |

### Run Commands
```bash
# Interactive chat (main agent)
just tui
cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

# Single prompt
just cli "Hello"
cd /home/zerwiz/woh/src && npx tsx cli.ts "Hello"
```

---

## Interactive Commands

```
>                      - Type your message
/clear or /c          - Clear conversation
/models               - List available models
/quit or /q or /exit  - Exit and save session
```

---

## Features Working ✓

- [x] Interactive chat with main agent
- [x] Session persistence (saves to `~/.alloy/state.json`)
- [x] Commands: /clear, /models, /quit
- [x] Ollama integration (local models)
- [x] Default model: qwen3.5:9b

---

## Todo

- [x] Interactive chat working
- [ ] Add tools (read, write, ls, bash)
- [ ] Add agent dispatch (@builder, @scanner, etc.)
- [ ] Add team mode
- [ ] Add chain mode
- [ ] Add theme switching
- [ ] Add damage control

---

## Not Being Used (Cleanup Later)

- `/home/zerwiz/woh/src/agent-chain.ts` - Complex chain UI
- `/home/zerwiz/woh/src/agent-team.ts` - Complex team UI
- `/home/zerwiz/woh/src/ui/` - TUI components
- `/home/zerwiz/woh/lib/alloy/*` - Elixir backend