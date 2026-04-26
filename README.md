# Alloy
# WHO Agents

[![Hex.pm](https://img.shields.io/hexpm/v/alloy.svg)](https://hex.pm/packages/alloy)
[![CI](https://github.com/alloy-ex/alloy/actions/workflows/ci.yml/badge.svg)](https://github.com/alloy-ex/alloy/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/hex-docs-blue.svg)](https://hexdocs.pm/alloy)
[![License](https://img.shields.io/hexpm/l/alloy.svg)](LICENSE)
**Alloy-based Multi-Agent System for Local-First AI Development**

**Minimal, OTP-native agent loop for Elixir.**
Local-First AI Development with small local models that work best for local programming workflows.

Alloy is the completion-tool-call loop and nothing else. Send messages to any LLM, execute tool calls, loop until done. Swap providers with one line. Run agents as supervised GenServers. No opinions on sessions, persistence, memory, scheduling, or UI — those belong in your application.
<div align="center">

```elixir
{:ok, result} = Alloy.run("Read mix.exs and tell me the version",
  provider: {Alloy.Provider.OpenAI, api_key: System.get_env("OPENAI_API_KEY"), model: "gpt-5.4"},
  tools: [Alloy.Tool.Core.Read]
)
⚡ Small Models | 🔒 Privacy-First | 🏠 No Cloud Dependencies | 💾 Self-Contained

result.text #=> "The version is 0.12.0"
```
</div>

## Why Alloy?

Most agent frameworks try to be everything — sessions, memory, RAG, multi-agent orchestration, scheduling, UI. Alloy does one thing well: the agent loop. Inspired by [Pi Agent](https://github.com/badlogic/pi-mono)'s minimalism, Alloy brings the same philosophy to the BEAM with OTP's natural advantages: supervision, fault isolation, parallel tool execution, and real concurrency.

- **6 providers** — Anthropic, Gemini, OpenAI, Codex, xAI, and OpenAICompat (works with any OpenAI-compatible API: Ollama, OpenRouter, DeepSeek, Mistral, Groq, Together, etc.)
- **4 built-in tools** — read, write, edit, bash
- **GenServer agents** — supervised, stateful, message-passing
- **Streaming** — token-by-token from any provider, unified interface
- **Async dispatch** — `send_message/2` fires non-blocking, result arrives via PubSub
- **Middleware** — custom hooks, tool blocking, argument editing
- **Context compaction** — summary-based compaction when approaching token limits, with configurable reserve and fallback to truncation
- **Memory primitive** — `Alloy.Memory` behaviour for Anthropic's `memory_20250818` tool. Alloy owns the wire format and path validation; you own the store (in-memory, disk, Postgres — whatever fits)
- **Prompt caching** — Anthropic `cache: true` adds cache breakpoints for 60-90% input token savings
- **Reasoning blocks** — DeepSeek/xAI `reasoning_content` parsed as first-class thinking blocks
- **Tool safety** — `concurrent?/0` controls parallel execution, `max_result_chars/0` caps output, prompt-too-long auto-recovery
- **Structured output** — `until_tool` forces the loop to continue until a specific tool is called
- **Provider passthrough** — `extra_body` injects arbitrary provider-specific params (response_format, temperature, reasoning_effort)
- **Telemetry** — run, turn, provider, and compaction lifecycle events for OTEL/logging/metrics
- **Cost guard** — `max_budget_cents` halts the loop before overspending
- **OTP-native** — supervision trees, hot code reloading, real parallel tool execution
- **~7,500 lines** — small enough to read, understand, and extend

## Design Boundary

Alloy stays minimal by owning protocol and loop concerns, not application
workflows.

What belongs in Alloy:
- Provider wire-format translation
- Tool-call / completion loop mechanics
- Normalized message blocks
- Opaque provider-owned state such as stored response IDs
- Provider response metadata such as citations or server-side tool telemetry

What does not belong in Alloy:
- Sessions and persistence policy
- File storage, indexing, or retrieval workflows
- UI rendering for citations, search, or artifacts
- Scheduling, background job orchestration, or dashboards
- Tenant plans, quotas, billing, or hosted infrastructure policy

Rule of thumb: if the feature is required to speak a provider API correctly,
and could help any Alloy consumer, it likely belongs here. If it needs a
database table, product defaults, UI decisions, or tenancy logic, it belongs in
your application layer.

## Installation

Add `alloy` to your dependencies in `mix.exs`:
---

```elixir
def deps do
  [
    {:alloy, "~> 0.12"},
    # Optional: supervised runtime wrapper (sessions, async dispatch, memory stores)
    {:alloy_agent, "~> 0.1"}
  ]
end
```
## 🎯 Why This Project?

## Quick Start
This repository demonstrates why small local language models are ideal for local development workflows. By running models locally, you maintain full control over your data, reduce latency, and eliminate cloud API costs.

### Simple completion
> "The right tool for the job doesn't require infinite compute power—sometimes small is perfectly powerful."

```elixir
{:ok, result} = Alloy.run("What is 2+2?",
  provider: {Alloy.Provider.Anthropic, api_key: "sk-ant-...", model: "claude-sonnet-4-6"}
)
---

result.text #=> "4"
```
## 📋 Quick Start

### Agent with tools
### Prerequisites

```elixir
{:ok, result} = Alloy.run("Read mix.exs and summarize the dependencies",
  provider: {Alloy.Provider.Gemini,
    api_key: "...", model: "gemini-2.5-flash-lite"},
  tools: [Alloy.Tool.Core.Read, Alloy.Tool.Core.Bash],
  max_turns: 10
)
```
- Alloy Agent (based on Chris O'Halloran's Alloy library)
- Local LLM setup (e.g., Ollama, LM Studio, or local GPU/CPU inference)
- Elixir/Alloy environment

Gemini model IDs Alloy now budgets for include `gemini-2.5-pro`,
`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-3-pro-preview`, and
`gemini-3-flash-preview`.
### Installation

### Swap providers in one line
```bash
# Clone or access this repository
cd /path/to/who

```elixir
# The same tools and conversation work with any provider
opts = [tools: [Alloy.Tool.Core.Read], max_turns: 10]
# Enable WHO Agents extension
pi -e extensions/who-agents.ts
```

# Anthropic
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.Anthropic, api_key: "...", model: "claude-sonnet-4-6"}} | opts])
### First Steps

# OpenAI
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.OpenAI, api_key: "...", model: "gpt-5.4"}} | opts])
1. **Configure your local model** - Set up your preferred local LLM (Llama, Mistral, etc.)
2. **Define your agents** - Create agent definitions in the `agents/` directory
3. **Create teams** - Organize agents into teams using `teams.yaml`
4. **Start working** - Use the `/who-agents` command to activate the system

# Gemini
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.Gemini, api_key: "...", model: "gemini-2.5-flash"}} | opts])
---

# xAI via Responses-compatible API
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.OpenAI, api_key: "...", api_url: "https://api.x.ai", model: "grok-4.20-0309-reasoning"}} | opts])
## 🤖 Available Agents

# xAI via chat completions (reasoning models, extra_body)
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.OpenAICompat, api_key: "...", api_url: "https://api.x.ai", model: "grok-4.1-fast-reasoning"}} | opts])
| Agent | Role | Tools | Description |
|-------|------|-------|-------------|
| architect | Core | - | Local architecture design |
| coder | Developer | read, write, bash | Local code implementation |
| reviewer | Analyst | read, write, bash | Code review and validation |
| tester | Validator | bash, read | Local testing & validation |
| researcher | Researcher | read, write, find | Local documentation & research |

# Any OpenAI-compatible API (Ollama, OpenRouter, DeepSeek, Mistral, Groq, etc.)
Alloy.run("Read mix.exs", [{:provider, {Alloy.Provider.OpenAICompat, api_url: "http://localhost:11434", model: "llama4"}} | opts])
```
---

### Streaming
## 🛠️ Available Tools

For a one-shot run, use `Alloy.stream/3`:
| Tool | Description |
|------|-------------|
| `read` | Read files with line numbers |
| `write` | Write files (creates parent directories) |
| `edit` | Search-and-replace in files |
| `bash` | Execute shell commands |
| `grep` | Search file contents |
| `find` | Search for files |
| `ls` | List directories |

```elixir
{:ok, result} =
  Alloy.stream("Explain OTP", fn chunk ->
    IO.write(chunk)
  end,
    provider: {Alloy.Provider.OpenAI, api_key: "...", model: "gpt-5.4"}
  )
```
---

For a persistent agent process with conversation state, use `Alloy.Agent.Server.stream_chat/4`:
## 🏗️ Architecture Overview

```elixir
{:ok, agent} = Alloy.Agent.Server.start_link(
  provider: {Alloy.Provider.OpenAI, api_key: "...", model: "gpt-5.4"},
  tools: [Alloy.Tool.Core.Read]
)

{:ok, result} = Alloy.Agent.Server.stream_chat(agent, "Explain OTP", fn chunk ->
  IO.write(chunk)  # Print each token as it arrives
end)
```
┌───────────────┐         ┌───────────────┐
│  Dispatcher   │ ──────▶│  Local Agent   │
│   (Primary)   │        │    (Local)     │
│  ┌──────────┐ │        └───────────────┘
│  │ Orchestrates│       │ Runs locally   │
│  │ via tools  │       │ No cloud needed │
│  └──────────┘ │        └───────────────┘
└───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Team Manager  │
            │ - YAML teams  │
            │ - State mgmt  │
            └───────────────┘
```

All providers support streaming. If a custom provider doesn't implement
`stream/4`, the turn loop falls back to `complete/3` automatically.
### Key Features

`Alloy.run/2` remains the buffered convenience API. Use `Alloy.stream/3`
when you want the same one-shot flow with token streaming.
- ✅ **Fully Local** - All operations run on your machine
- ✅ **Privacy-First** - Your data never leaves your computer
- ✅ **Small Models** - Optimized for local hardware
- ✅ **No Cloud Dependencies** - Zero external API calls
- ✅ **Self-Contained** - Complete offline capability

### Provider-owned state
---

Some provider APIs expose server-side state such as stored response IDs.
That transport concern lives in Alloy; your app decides whether and how to
persist it.
## 💻 Usage

Results expose provider-owned state in `result.metadata.provider_state`:
### Tool Examples

```elixir
{:ok, result} =
  Alloy.run("Read the repo",
    provider: {Alloy.Provider.OpenAI,
      api_key: System.get_env("XAI_API_KEY"),
      api_url: "https://api.x.ai",
      model: "grok-4.20-0309-reasoning",
      store: true
    }
  )

provider_state = result.metadata.provider_state
```
# Read a file
Alloy.Tool.FileRead.read("file.txt")

Pass that state back to the same provider on the next turn to continue a
provider-native conversation:
# Execute local commands
Alloy.Tool.SecureShell.exec("ls -la")

```elixir
{:ok, next_result} =
  Alloy.run("Keep going",
    messages: result.messages,
    provider: {Alloy.Provider.OpenAI,
      api_key: System.get_env("XAI_API_KEY"),
      api_url: "https://api.x.ai",
      model: "grok-4.20-0309-reasoning",
      provider_state: provider_state
    }
  )
# Search local files
Alloy.Tool.FileSearch.search("*")

# Edit local files
Alloy.Tool.FileEdit.edit("file.txt", "old", "new")
```

### Provider-native tools and citations
### Team Configuration

Responses-compatible providers can expose built-in server-side tools without
leaking those wire details into your app layer.
**File:** `.pi/agents/teams.yaml`

For xAI search tools:
```yaml
# Team definitions
local-dev:
  - coder
  - reviewer
  - tester

```elixir
{:ok, result} =
  Alloy.run("Summarise the latest xAI docs updates",
    provider: {Alloy.Provider.OpenAI,
      api_key: System.get_env("XAI_API_KEY"),
      api_url: "https://api.x.ai",
      model: "grok-4.20-0309-reasoning",
      web_search: %{allowed_domains: ["docs.x.ai"]},
      include: ["inline_citations"]
    }
  )
documentation:
  - researcher
  - archivist

operations:
  - monitor
  - maintainer
```

Citation metadata is exposed in two places:
- `result.metadata.provider_response.citations` for provider-level citation data
- assistant text blocks may include `:annotations` for inline citation spans
---

### Overriding model metadata
## 🎨 Widget Commands

Alloy derives the compaction budget from the configured provider model when it
knows that model's context window. If you need to support a just-released model
before Alloy ships a catalog update, override it in config:
| Command | Description | Example |
|---------|-------------|---------|
| `/who-agents` | Select active team | Shows team selection dialog |
| `/who-agents-list` | List all agents | Shows agent status |
| `/who-agents-grid N` | Set widget columns | `/who-agents-grid 4` |
| `/who-agents-clear` | Clear all states | Start fresh session |

```elixir
{:ok, result} = Alloy.run("Summarise this repository",
  provider: {Alloy.Provider.OpenAI, api_key: "...", model: "gpt-5.4-2026-03-05"},
  model_metadata_overrides: %{
    "gpt-5.4" => 900_000,
    "acme-reasoner" => %{limit: 640_000, suffix_patterns: ["", ~r/^-\d{4}\.\d{2}$/]}
  }
)
```

Set `max_tokens` explicitly when you want a fixed compaction budget. Otherwise
Alloy derives it from the current model, including after
`Alloy.Agent.Server.set_model/2` switches to a different provider model.
---

Use `compaction:` when you want to tune how much room Alloy reserves before it
summarizes older context:
## 📁 Project Structure

```elixir
{:ok, result} = Alloy.run("Summarise this repository",
  provider: {Alloy.Provider.OpenAI, api_key: "...", model: "gpt-5.4"},
  compaction: [
    reserve_tokens: 12_000,
    keep_recent_tokens: 8_000,
    fallback: :truncate
  ]
)
```
project/
├── .pi/
│   ├── agents/
│   │   ├── teams.yaml           # Team definitions
│   │   ├── coder.md             # Agent definitions
│   │   └── reviewer.md
│   └── agent-sessions/          # Session state files
├── agents/                      # Generic agent definitions
│   ├── coder.md
│   └── reviewer.md
├── docs/                        # Documentation
└── scripts/
    ├── setup-agents.sh
    └── deploy-agents.sh
```

### Cost guard
---

Cap how much an agent run can spend:
## ⚙️ Configuration Options

```elixir
{:ok, result} = Alloy.run("Research this codebase thoroughly",
  provider: {Alloy.Provider.Anthropic, api_key: "...", model: "claude-sonnet-4-6"},
  tools: [Alloy.Tool.Core.Read, Alloy.Tool.Core.Bash],
  max_budget_cents: 50
)

case result.status do
  :completed -> IO.puts(result.text)
  :budget_exceeded -> IO.puts("Stopped: spent #{result.usage.estimated_cost_cents}¢")
end
```
### Model Configuration

Set `max_budget_cents: nil` (default) for no limit.
```bash
# Local model path
export MODEL_PATH=./models

### Anthropic prompt caching
# API key (empty for local)
export API_KEY=""

Enable prompt caching to save 60-90% on input tokens. Alloy automatically adds
`cache_control` breakpoints to the system prompt and last tool definition:
# Session directory
export SESSION_DIR=.pi/agent-sessions

```elixir
{:ok, result} = Alloy.run("Explain this codebase",
  provider: {Alloy.Provider.Anthropic,
    api_key: "...", model: "claude-sonnet-4-6",
    cache: true
  },
  tools: [Alloy.Tool.Core.Read, Alloy.Tool.Core.Bash],
  system_prompt: "You are a senior Elixir developer."
)

# Cache usage is reported in result.usage
result.usage.cache_creation_input_tokens  #=> 1500
result.usage.cache_read_input_tokens      #=> 1500  (on subsequent calls)
# Team directory
export TEAMS_DIR=.pi/agents
```

### Memory (Anthropic `memory_20250818`)

Alloy exposes memory as a behaviour — `Alloy.Memory` — matching the split
Anthropic uses in their own Python SDK: Alloy owns the protocol (six
commands on a `/memories/` tree, return-string formats, path validation);
your code owns the backing store. No bytes touch Anthropic's servers.
### Agent Definition Format

```elixir
defmodule MyApp.Memory.Disk do
  @behaviour Alloy.Memory

  @impl true
  def view(store, path), do: # read from disk
  @impl true
  def create(store, path, text), do: # write
  @impl true
  def str_replace(store, path, old, new), do: # ...
  @impl true
  def insert(store, path, line, text), do: # ...
  @impl true
  def delete(store, path), do: # ...
  @impl true
  def rename(store, old_path, new_path), do: # ...
end

{:ok, result} = Alloy.run("Remember the user prefers SI units",
  provider: {Alloy.Provider.Anthropic, api_key: "sk-ant-...", model: "claude-sonnet-4-6"},
  memory: {MyApp.Memory.Disk, root: "/var/agent/memories"}
)
```yaml
---
name: [Unique Agent Name]
description: [Brief Description]
tools: [Comma-Separated List]
---
[Agent System Prompt and Protocols]
```

When `:memory` is set, Alloy injects the `memory_20250818` tool into the
Anthropic request and adds the `context-management-2025-06-27` beta
header. Memory tool calls are routed through `Alloy.Memory.Router`
(not the general tool executor) so the typed-tool contract stays clean.
---

The store term (second element of `{module, opts}`) is opaque — pass a
keyword list, a map, a `pid()`, or a struct, whichever your store needs.
Alloy does not bake session scoping into the contract; if you want
per-session memory trees, thread `session_id: "..."` through your store
opts and namespace inside your implementation.
## 📋 Best Practices

As of 0.12.0, memory is Anthropic-only — configuring `:memory` with any
other provider raises at `Alloy.run/2` entry. Other providers will be
wired as they ship their own memory primitives.
### Agent Definition Guidelines

### Reasoning model support (DeepSeek, xAI)
1. **Name** - Use clear, descriptive names (noun, not verb)
2. **Description** - One-line functional description
3. **Tools** - Only list needed tools
4. **Prompt** - Include operational protocols
5. **Context** - Be explicit about limitations

OpenAI-compatible reasoning models that return `reasoning_content` (DeepSeek-R1,
xAI Grok reasoning variants) are automatically parsed into thinking blocks:
### Team Organization

```elixir
{:ok, result} = Alloy.run("Solve this step by step",
  provider: {Alloy.Provider.OpenAICompat,
    api_url: "https://api.x.ai",
    api_key: "...", model: "grok-4.1-fast-reasoning"
  }
)

# Thinking blocks are preserved in message content
[thinking, text] = hd(result.messages).content
thinking.type     #=> "thinking"
thinking.thinking #=> "Step 1: Let me consider..."
text.type         #=> "text"
text.text         #=> "The answer is 42."
```
1. **Separation of Concerns** - Group by function
2. **Clear Boundaries** - No overlap between teams
3. **Purpose Documentation** - Comment team YAML files

### Provider-specific parameters (extra_body)
### Local-First Philosophy

Pass arbitrary provider-specific parameters via `extra_body`. It merges last,
so it can override any default field:
- **Keep data local** - Never upload code or data to cloud
- **Use small models** - Optimize for your hardware
- **Test locally** - Validate before any deployment
- **Self-host everything** - Full control over your stack

```elixir
{:ok, result} = Alloy.run("Return JSON",
  provider: {Alloy.Provider.OpenAICompat,
    api_url: "https://api.deepseek.com",
    api_key: "...", model: "deepseek-chat",
    extra_body: %{
      "response_format" => %{"type" => "json_object"},
      "temperature" => 0.3
    }
  }
)
```
---

Works for any provider param: `reasoning_effort`, `max_completion_tokens`,
`presence_penalty`, etc.
## 🐛 Troubleshooting

### Telemetry
### Common Issues

Alloy emits telemetry events for observability. Attach handlers for OTEL,
logging, or custom metrics:
**"No agents found"**
- Check agent files in `.pi/agents/`, `agents/`
- Verify frontmatter syntax
- Ensure `.md` extension

```elixir
:telemetry.attach_many("my-handler", [
  [:alloy, :run, :start],
  [:alloy, :run, :stop],
  [:alloy, :turn, :start],
  [:alloy, :turn, :stop],
  [:alloy, :provider, :request],
  [:alloy, :compaction, :done],
  [:alloy, :tool, :start],
  [:alloy, :tool, :stop],
  [:alloy, :event]
], &MyApp.Telemetry.handle_event/4, nil)
```
**"Agent not found"**
- Check name spelling (case-insensitive)
- Verify team.yaml references
- Run `/who-agents-list` to see loaded agents

| Event | Measurements | Metadata |
|-------|-------------|----------|
| `[:alloy, :run, :start]` | `system_time` | `model` |
| `[:alloy, :run, :stop]` | `duration_ms` | `status`, `turns`, `model` |
| `[:alloy, :turn, :start]` | `system_time` | `turn` |
| `[:alloy, :turn, :stop]` | — | `turn`, `status` |
| `[:alloy, :provider, :request]` | `duration_ms` | `provider`, `model`, `streaming`, `attempt`, `result` |
| `[:alloy, :compaction, :done]` | `messages_before`, `messages_after` | `turn` |
| `[:alloy, :tool, :start]` | — | tool identity, correlation |
| `[:alloy, :tool, :stop]` | `duration_ms` | tool identity, result |
**"Model not found"**
- Verify local model path is set
- Check model is loaded in your inference engine
- Restart Pi after model installation

### Structured output with `until_tool`
**"Widget doesn't appear"**
- Update widget: `pi -e extensions/who-agents.ts`
- Force update: `/who-agents-grid`
- Check console for errors

Force the model to call a specific tool before the loop completes. This is more
reliable than response format instructions because the tool schema is validated
at the API level:
### Debug Workflow

```elixir
defmodule SubmitAnswer do
  @behaviour Alloy.Tool
  def name, do: "submit_answer"
  def description, do: "Submit your final answer as structured data."
  def input_schema do
    %{type: "object", properties: %{
      answer: %{type: "string"},
      confidence: %{type: "number", minimum: 0, maximum: 1}
    }, required: ["answer", "confidence"]}
  end
  def execute(input, _ctx), do: {:ok, "Received: #{input["answer"]}"}
end

{:ok, result} = Alloy.run("What is the capital of France?",
  provider: {Alloy.Provider.Anthropic, api_key: "...", model: "claude-sonnet-4-6"},
  tools: [SubmitAnswer],
  until_tool: "submit_answer"
)
```bash
# List all agents
pi -e extensions/who-agents.ts /who-agents-list

# Toggle team
pi -e extensions/who-agents.ts /who-agents-team

# View session
cat .pi/agent-sessions/your-agent.json

# Clear state
pi -e extensions/who-agents.ts /who-agents-clear
```

### Middleware: editing tool arguments
---

Middleware can return `{:edit, modified_call}` from `:before_tool_call` to rewrite
tool arguments before execution (e.g., policy enforcement, input sanitization):
## 🔐 Security Considerations

```elixir
defmodule SanitizeBash do
  @behaviour Alloy.Middleware
### Local-First Security

  def call(:before_tool_call, state) do
    call = state.config.context[:current_tool_call]
- **No data exfiltration** - Everything stays on your machine
- **Local model inference** - Your models never see external data
- **No cloud APIs** - Zero external dependencies
- **Local storage** - All sessions stored locally

    if call[:name] == "bash" && String.contains?(call[:input]["command"], "rm ") do
      {:edit, %{call | input: %{"command" => "echo 'rm commands are blocked'"}}}
    else
      state
    end
  end
### Best Practices

  def call(_hook, state), do: state
end
```
1. **Keep models updated** - Regular local model maintenance
2. **Use secure paths** - Protect model files from unauthorized access
3. **Monitor sessions** - Clear old sessions when done
4. **Validate inputs** - Prevent command injection

### Supervised GenServer agent
---

```elixir
{:ok, agent} = Alloy.Agent.Server.start_link(
  provider: {Alloy.Provider.Anthropic, api_key: "...", model: "claude-sonnet-4-6"},
  tools: [Alloy.Tool.Core.Read, Alloy.Tool.Core.Edit, Alloy.Tool.Core.Bash],
  system_prompt: "You are a senior Elixir developer."
)

{:ok, response} = Alloy.Agent.Server.chat(agent, "What does this project do?")
{:ok, response} = Alloy.Agent.Server.chat(agent, "Now refactor the main module")
## 📚 Examples

### Example 1: Local Code Review

```yaml
# Task: "Review and refactor utils/helpers.ts"

# Local workflow:
# 1. coder agent: Initial review (local)
# 2. reviewer agent: Code quality check (local)
# 3. archivist: Update changelog (local)
```

### Async dispatch (Phoenix LiveView)
### Example 2: Documentation Generation

Fire a message without blocking the caller — ideal for LiveView and background jobs:
```yaml
# Task: "Generate API documentation from local codebase"

```elixir
# Subscribe to receive the result
Phoenix.PubSub.subscribe(MyApp.PubSub, "agent:#{session_id}:responses")

# Returns {:ok, request_id} immediately — agent works in the background
{:ok, req_id} = Alloy.Agent.Server.send_message(agent, "Summarise this report",
  request_id: "req-123"
)

# Handle the result whenever it arrives
def handle_info({:agent_response, %{text: text, request_id: "req-123"}}, socket) do
  {:noreply, assign(socket, :response, text)}
end
# Local workflow:
# 1. researcher agent: Scan local files
# 2. researcher agent: Generate docs
# 3. archivist agent: Save to local docs folder
```

## Providers
---

| Vendor | Recommended Module | Example Models |
|--------|---------------------|----------------|
| Anthropic | `Alloy.Provider.Anthropic` | `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5` |
| Gemini | `Alloy.Provider.Gemini` | `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-3-pro-preview`, `gemma-4-26b-a4b-it` (open-weight) |
| OpenAI | `Alloy.Provider.OpenAI` | `gpt-5.4` |
| xAI | `Alloy.Provider.OpenAI` with `api_url: "https://api.x.ai"` | `grok-4.20-0309-reasoning`, `grok-4.20-multi-agent-0309`, `grok-4.1-fast-reasoning`, `grok-code-fast-1` |
| Other OpenAI-compatible APIs | `Alloy.Provider.OpenAICompat` | `kimi-k2.6` (Moonshot), `qwen3-coder-plus` (1M ctx), `glm-4.6`, `mistral-large-2512`, plus Ollama, OpenRouter, DeepSeek, Groq, Together |
## 📞 Support

Use `Alloy.Provider.OpenAI` for native Responses APIs like OpenAI and xAI.
Use `Alloy.Provider.Gemini` for Gemini's native GenerateContent API.
Use `Alloy.Provider.OpenAICompat` for chat-completions compatible APIs and local runtimes.
### Getting Help

`OpenAICompat` works with any API that implements the OpenAI chat completions format.
Just set `api_url`, `model`, and optionally `api_key` and `chat_path`.
- **GitHub Issues:** Report bugs and feature requests
- **Community:** Discuss local-first AI development
- **Documentation:** Check docs/ directory

## Built-in Tools
### Reporting Issues

| Tool | Module | Description |
|------|--------|-------------|
| **read** | `Alloy.Tool.Core.Read` | Read files from disk |
| **write** | `Alloy.Tool.Core.Write` | Write files to disk |
| **edit** | `Alloy.Tool.Core.Edit` | Search-and-replace editing |
| **bash** | `Alloy.Tool.Core.Bash` | Execute shell commands (restricted shell by default) |
Include:
- Error message
- Steps to reproduce
- Team configuration
- Agent definitions
- Local model information

### Custom tools
---

```elixir
defmodule MyApp.Tools.WebSearch do
  @behaviour Alloy.Tool

  @impl true
  def name, do: "web_search"

  @impl true
  def description, do: "Search the web for information"

  @impl true
  def input_schema do
    %{
      type: "object",
      properties: %{query: %{type: "string", description: "Search query"}},
      required: ["query"]
    }
  end

  @impl true
  def execute(%{"query" => query}, _context) do
    # Your implementation here
    {:ok, "Results for: #{query}"}
  end
end
```
## 📜 License

### Code execution (Anthropic)
MIT License - See LICENSE file for details.

Enable Anthropic's server-side code execution sandbox:
---

```elixir
{:ok, result} = Alloy.run("Calculate the first 20 Fibonacci numbers",
  provider: {Alloy.Provider.Anthropic, api_key: "...", model: "claude-sonnet-4-6"},
  code_execution: true
)
```
## 👨‍💻 Project Author

## Architecture
Made by [zerwiz](https://github.com/zerwiz)

```
Alloy.run/2                    One-shot agent loop (pure function)
Alloy.Agent.Server             GenServer wrapper (stateful, supervisable)
Alloy.Agent.Turn               Single turn: call provider → execute tools → return
Alloy.Provider                 Behaviour: translate wire format ↔ Alloy.Message
Alloy.Tool                     Behaviour: name, description, input_schema, execute
Alloy.Middleware               Pipeline: custom hooks, tool blocking
Alloy.Context.Compactor        Automatic conversation summarization
```
- 🌐 Website: https://whynotproductions.netlify.app
- 💻 GitHub: https://github.com/zerwiz/who

---

Sessions, persistence, multi-agent coordination, scheduling, skills, and UI
belong in your application layer. See [Anvil](https://github.com/alloy-ex/anvil)
for a reference Phoenix application built on Alloy.
<div align="center">

## License
**WHO Agents** - Multi-agent system for local-first AI development

MIT — see [LICENSE](LICENSE).
_Based on Chris O'Halloran's Alloy Agent library_
_Showing that small local models work best for local programming_

## Releases
[Alloy Documentation](https://hexdocs.pm/alloy/Alloy.html) |
[Alloy GitHub](https://github.com/alloy-ex/alloy)

Hex.pm publishing is handled by GitHub Actions on `v*` tags.
Successful publishes also dispatch the landing-site version sync workflow.
</div>
