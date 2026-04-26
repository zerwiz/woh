# Configuration Guide

This document explains the configuration options for the Elixir `alloy_agent` system and the legacy Python model management layer.

## 📋 Configuration File Structure

The main configuration file is `config.yaml`:

```yaml
models:
  - path: ./models
    default: phi-2
    
  ph2:
    path: ./models/phi-2
    model_id: microsoft/phi-2
    download: true
    
  tinyllama:
    path: ./models/tinyllama
    model_id: TinyLlama/TinyLlama-1.1B-Chat-v1.0
    download: true
    
  llama:
    path: ./models/llama-3.1-8b
    model_id: meta-llama/Llama-3.1-8B-Instruct-GGUF
    model_file: "llama-3.1-8b.Q4_K_M.gguf"
    download: true

api:
  anthropic:
    key: ${ANTHROPIC_API_KEY}
  openai:
    key: ${OPENAI_API_KEY}
  google:
    api_key: ${GOOGLE_API_KEY}
  ollama:
    host: http://localhost:11434
    models:
      - llama2
      - mistral
      - phi

extension_events:
  enabled: true
  
cron:
  # Heartbeat/scheduler configuration
  enabled: false
```

## 🔐 Environment Variables

The following environment variables are supported:

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `akh_...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GOOGLE_API_KEY` | Google API key | `AIza...` |
| `MODEL_PATH` | Default model storage path | `./models` |
| `API_KEY` | API key (optional) | (leave empty for local) |

## 🧠 Model Configuration

### Supported Models

| Model | Path | Downloads From |
|-------|------|----------------|
| phi-2 | `./models/phi-2` | Hugging Face |
| tinyllama | `./models/tinyllama` | Hugging Face |
| llama-3.1-8b | `./models/llama-3.1-8b` | Hugging Face |

### Model Selection Logic

When using Elixir's `alloy_agent`, model selection is handled automatically:

1. Check if model file exists at configured path
2. If not, download based on `model_id` and `model_file`
3. Fall back to default model if requested model unavailable

### Custom Model Addition

To add a custom model:

```elixir
# In config.yaml
models:
  custom:
    path: ./models/custom
    model_id: myorg/custom-model
    model_file: "custom.Q4_K_M.gguf"
    download: true
```

## 🛠️ Tool Configuration

Tools can be enabled/disabled and configured with options:

```elixir
%AlloyAgent{
  tools: [
    {:read, path_validation: true},
    {:write, create_directories: true},
    {:edit, overlap_check: true},
    {:bash, sandbox: true}
    # :scratchpad is always enabled
  ]
}
```

### Tool-Specific Options

| Tool | Option | Description |
|------|--------|-------------|
| read | `path_validation: true` | Verify file exists before reading |
| write | `create_directories: true` | Create parent directories |
| edit | `overlap_check: true` | Ensure non-overlapping edits |
| bash | `sandbox: true` | Execute in sandboxed environment |

## 📝 Skills System

Skills are defined using frontmatter in markdown files:

```yaml
---
name: my-skill
description: My custom AI skill
---

# Skill implementation here
```

Skills are loaded from the `./skills` directory during agent startup.

## 🔄 Extension Events

Extension events allow integration with external systems:

```elixir
# Register an extension event handler
Events.register_handler([:alloy, :extension, :loaded], fn _event ->
  # Custom initialization
end)
```

## 📊 Middleware Pipeline

Middleware can be added to the pipeline:

```elixir
# Add preprocessing middleware
AlloyAgent.with_middleware(:pre_prompt, fn prompt, opts ->
  # Pre-process prompt
  prompt
end)

# Add post-processing middleware  
AlloyAgent.with_middleware(:post_prompt, fn response, opts ->
  # Post-process response
  response
end)
```

## ⏰ Cron/Heartbeat Scheduler

Scheduled tasks can be configured:

```yaml
cron:
  enabled: true
  heartbeat_interval: 300
  tasks:
    - name: "cleanup_sessions"
      schedule: "0 * * * *"  # Every hour
      action: cleanup_old_sessions
```

## 🧪 Testing Configuration

```yaml
test:
  models_only: true  # Don't download models during tests
  skip_model_validation: false
  verbose: true
```

## 🌐 Provider-Specific Config

Each provider type has specific configuration requirements:

### Anthropic

```yaml
api:
  anthropic:
    key: ${ANTHROPIC_API_KEY}
    model: "claude-3-5-sonnet-20241022"
    max_tokens: 128000
    timeout: 30000
```

### OpenAI

```yaml
api:
  openai:
    key: ${OPENAI_API_KEY}
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
```

### Google (Gemini)

```yaml
api:
  google:
    api_key: ${GOOGLE_API_KEY}
    model: "gemini-1.5-flash"
```

### Ollama

```yaml
api:
  ollama:
    host: "http://localhost:11434"
    models:
      - llama2
      - mistral
      - phi
```

## 🔧 Troubleshooting

### Models Not Loading

1. Check models are downloaded: `ls models/`
2. Verify file permissions: `chmod 644 models/*.gguf`
3. Check environment variables: `env | grep -i "MODEL\|PATH"`

### Streaming Not Working

1. Ensure `AlloyAgent.Server` is started
2. Check network connectivity for remote models
3. Verify API keys are set

### Tool Errors

1. Check tool specs in `lib/alloy_agent/tools.ex`
2. Verify input/output schemas match expectations
3. Ensure file paths are accessible

## 📚 Additional Resources

- [Model Hub](https://huggingface.co/models) - Access all available models
- [Elixir Docs](https://elixir-lang.org/docs) - Learn Elixir
- [Alloy Docs](./docs/alloy-intro.md) - Get started with alloy_agent
- [Migration Guide](./docs/migration-guide.md) - Transitioning from Python
