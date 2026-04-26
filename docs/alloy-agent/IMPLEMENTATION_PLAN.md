# Alloy Agent Implementation Plan

## Vision

Interactive AI coding agent with chat interface like pi.dev, using local Ollama models.

---

## Files

| File | Purpose |
|------|---------|
| `/home/zerwiz/woh/src/cli-tui.ts` | Interactive chat CLI (main entry) |
| `/home/zerwiz/woh/src/cli.ts` | Single prompt CLI |
| `/home/zerwiz/woh/justfile` | Just commands |

---

## Run

```bash
# Interactive chat (main agent)
just tui
cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

# Single prompt
just cli "Hello"
```

---

## Commands

```
quit / q / exit  - Exit and save session
clear / c         - Clear conversation
models           - List available models
```

---

## Features

- [x] Interactive chat with infinite turns
- [x] Session persistence (`~/.alloy/state.json`)
- [x] Commands: quit, clear, models
- [x] Ollama integration
- [x] Default model: qwen3.5:9b
- [x] Sub-agent system prompt (for future dispatch)