# Alloy Agent - Main justfile

set dotenv-load := true

default:
    @just --list

# ==================== Main Interactive ====================

# Full chat with all features
cli:
	cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

tui: cli

# ==================== Different UIs ====================

# Chat mode
chat:
	cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

# Team mode - parallel agents
team:
	cd /home/zerwiz/woh/src && npx tsx agent-team.ts

# Chain mode - sequential
chain:
	cd /home/zerwiz/woh/src && npx tsx agent-chain.ts

# TillDone - tasks
todo:
	cd /home/zerwiz/woh/src && npx tsx tilldone.ts

# Subagent - background workers
subagent:
	cd /home/zerwiz/woh/src && npx tsx subagent-widget.ts

# ==================== Info ====================

models:
	@echo "qwen3.5:9b"

agents:
	@echo "architect, builder, scanner, tester, frontend, planner, reviewer"

teams:
	@echo "all, development, testing, review, code-review"

chains:
	@echo "plan-build, plan-build-review, full-review"

themes:
	@echo "nord, dracula, catppuccin, synthwave, tokyo"

# ==================== Quick Tasks ====================

analyze:
	cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

scan:
	cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

test:
	cd /home/zerwiz/woh/src && npx tsx cli-tui.ts

run TASK:
	cd /home/zerwiz/woh/src && npx tsx cli.ts "{{ TASK }}"