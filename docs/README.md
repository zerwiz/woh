# WHO Agents - Local-First AI Development

<div align="center">

**WHO Agents** - Local-First AI Development powered by [Alloy Agents](https://hexdocs.pm/alloy/)

<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
    ⚡ Small Models
  </span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
    🔒 Privacy-First
  </span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
    🏠 No Cloud Dependencies
  </span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">
    💾 Self-Contained
  </span>
</div>

<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
  <a href="https://github.com/zerwiz/who" style="background: #333; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">GitHub Repo</a>
  <a href="https://whynotproductions.netlify.app" style="background: #333; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Website</a>
</div>

</div>

---

## 🎯 Why This Project?

> "The right tool for the job doesn't require infinite compute power—sometimes small is perfectly powerful."

This repository is a comprehensive demonstration showing why **small local language models** are ideal for local development workflows. By running models locally, you maintain full control over your data, reduce latency, and eliminate cloud API costs.

---

## 🤝 Built on Alloy Agents

WHO Agents is based on **[Chris O'Halloran's Alloy Agent](https://hexdocs.pm/alloy/)** - a model-agnostic agent harness for Elixir.

- **Zero framework dependencies**
- **Any LLM provider support** (local models preferred)
- **Built-in tools** (file read/write, bash, search, etc.)
- **Streaming support** for real-time responses
- **Session management** for multi-turn conversations

**Resources:**
- [Alloy Docs](https://hexdocs.pm/alloy/Alloy.html)
- [Alloy GitHub](https://github.com/alloy-ex/alloy)

---

## 🚀 Quick Start

### Prerequisites

1. **Elixir** installed (`~> 1.17`)
2. **Local LLM** running (e.g., Ollama, LM Studio)
3. **Mix dependencies** installed

### Installation

```bash
# Clone the repository
git clone https://github.com/zerwiz/who.git
cd who

# Get and compile dependencies
mix deps.get
mix deps.compile

# Run the agent
mix run lib/who_agent.ex
```

### Usage

```elixir
{:ok, result} = Alloy.run("Explain this code",
  provider: {Alloy.Provider.OpenAI,
    api_key: "your_key",
    model: "your-local-model"}
)

result.text #=> "The explanation..."
```

---

## 🧰 Available Tools

WHO Agents comes with built-in tools:

| Tool | Description |
|------|-------------|
| `read` | Read files from filesystem |
| `write` | Write files (creates directories) |
| `edit` | Search-and-replace in files |
| `bash` | Execute shell commands |
| `grep` | Search file contents |
| `find` | Find files by pattern |
| `web_search` | Search the web |
| `file_search` | Search local files |

---

## 📁 Project Structure

```
who/
├── lib/
│   ├── who/
│   │   ├── agent.ex          # Main agent module
│   │   ├── tool.ex           # Tool behaviour
│   │   └── core/             # Core tools (bash, read, write, edit)
│   └── who_agent/            # Agent-specific modules
├── config/
│   └── config.exs           # Configuration
├── mix.exs                  # Mix project file
├── README.md                # This file
└── docs/                    # Documentation
```

---

## 💡 Key Features

### Small Models for Local Development

- **Efficient** - Small models fit on consumer hardware
- **Fast** - No network latency to cloud APIs
- **Private** - Your code stays on your machine
- **Cost-effective** - No API costs per token

### Privacy-First

- **No data leaves your machine**
- **No API keys required** (for local models)
- **Full control** over your data and prompts
- **Secure** - No cloud dependencies

### Self-Contained

- **Runs locally** - No cloud dependencies
- **Offline capable** - Once setup, works without internet
- **Portable** - Bring it anywhere
- **Customizable** - Extend with your own tools

---

## 🛠️ Example Usage

### Simple Question

```elixir
{:ok, result} = Alloy.run("What is 2+2?",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  }
)

IO.puts(result.text)
#=> "4"
```

### Agent with Tools

```elixir
{:ok, result} = Alloy.run("Read mix.exs and tell me the dependencies",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  },
  tools: [
    Alloy.Tool.Core.Read,
    Alloy.Tool.Core.Write,
    Alloy.Tool.Core.Bash
  ],
  max_turns: 10
)

IO.puts(result.text)
```

### Continuing a Conversation

```elixir
{:ok, result} = Alloy.run("Now edit that file",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  },
  tools: [
    Alloy.Tool.Core.Read,
    Alloy.Tool.Core.Write,
    Alloy.Tool.Core.Edit
  ],
  messages: previous_result.messages
)

IO.puts(result.text)
```

---

## 🌐 Local Models

### Running Locally

Use local models like:
- **Ollama** (https://ollama.ai/)
- **LM Studio**
- **LocalAI**
- **Anything that implements OpenAI-compatible API**

Example with Ollama:

```elixir
{:ok, result} = Alloy.run("Summarize this code",
  provider: {Alloy.Provider.OpenAI,
    api_key: "ollama",
    api_url: "http://localhost:11434",
    model: "llama3"
  }
)
```

---

## 📚 Documentation

For detailed documentation, see:

- **[USAGE-GUIDE](../USAGE-GUIDE.md)** - Commands and usage
- **[CONFIGURATION](../CONFIGURATION.md)** - Settings and options
- **[IMPLEMENTATION-GUIDE](../IMPLEMENTATION-GUIDE.md)** - Architecture
- **[TROUBLESHOOTING](../TROUBLESHOOTING.md)** - Common issues
- **[MIGRATION](../MIGRATION.md)** - From legacy to Alloy
- **[EXAMPLES](../examples/)** - Real-world configurations

---

## 🎓 Learn More

### Alloy Documentation

- [Alloy Docs](https://hexdocs.pm/alloy/)
- [Alloy GitHub](https://github.com/alloy-ex/alloy)
- [Alloy Examples](https://github.com/alloy-ex/alloy/tree/master/test)

### Local AI Resources

- [Ollama](https://ollama.ai/)
- [LM Studio](https://lmstudio.ai/)
- [LocalAI](https://localai.io/)
- [Text Generation WebUI](https://github.com/oobabooga/text-generation-webui)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

---

## 📜 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

<div align="center">

Made by **zerwiz**

<div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
  <a href="https://github.com/zerwiz/who">
    <img src="https://img.shields.io/badge/GitHub-zerwiz/who-blue.svg" alt="GitHub">
  </a>
  <a href="https://whynotproductions.netlify.app">
    <img src="https://img.shields.io/badge/Website-why
</think>

I apologize for the incomplete output. Let me write a complete, well-structured README.md file for the WHO Agents project:

```markdown
# WHO Agents - Local-First AI Development

<div align="center">

**WHO Agents** - Local-First AI Development powered by [Alloy Agents](https://hexdocs.pm/alloy/)

<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">⚡ Small Models</span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">🔒 Privacy-First</span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">🏠 No Cloud Dependencies</span>
  <span style="background: #2d572c; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold;">💾 Self-Contained</span>
</div>

<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
  <a href="https://github.com/zerwiz/who" style="background: #333; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">GitHub Repo</a>
  <a href="https://whynotproductions.netlify.app" style="background: #333; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Website</a>
</div>

</div>

---

## 🎯 Why This Project?

> "The right tool for the job doesn't require infinite compute power—sometimes small is perfectly powerful."

This repository is a comprehensive demonstration showing why **small local language models** are ideal for local development workflows. By running models locally, you maintain full control over your data, reduce latency, and eliminate cloud API costs.

---

## 🤝 Built on Alloy Agents

WHO Agents is based on **[Chris O'Halloran's Alloy Agent](https://hexdocs.pm/alloy/)** - a model-agnostic agent harness for Elixir.

- **Zero framework dependencies**
- **Any LLM provider support** (local models preferred)
- **Built-in tools** (file read/write, bash, search, etc.)
- **Streaming support** for real-time responses
- **Session management** for multi-turn conversations

**Resources:**
- [Alloy Docs](https://hexdocs.pm/alloy/Alloy.html)
- [Alloy GitHub](https://github.com/alloy-ex/alloy)

---

## 🚀 Quick Start

### Prerequisites

1. **Elixir** installed (`~> 1.17`)
2. **Local LLM** running (e.g., Ollama, LM Studio)
3. **Mix dependencies** installed

### Installation

```bash
# Clone the repository
git clone https://github.com/zerwiz/who.git
cd who

# Get and compile dependencies
mix deps.get
mix deps.compile

# Run the agent
mix run lib/who_agent.ex
```

### Usage

```elixir
{:ok, result} = Alloy.run("Explain this code",
  provider: {Alloy.Provider.OpenAI,
    api_key: "your_key",
    model: "your-local-model"}
)

result.text #=> "The explanation..."
```

---

## 🧰 Available Tools

WHO Agents comes with built-in tools:

| Tool | Description |
|------|-------------|
| `read` | Read files from filesystem |
| `write` | Write files (creates directories) |
| `edit` | Search-and-replace in files |
| `bash` | Execute shell commands |
| `grep` | Search file contents |
| `find` | Find files by pattern |
| `web_search` | Search the web |
| `file_search` | Search local files |

---

## 📁 Project Structure

```
who/
├── lib/
│   ├── who/
│   │   ├── agent.ex          # Main agent module
│   │   ├── tool.ex           # Tool behaviour
│   │   └── core/             # Core tools (bash, read, write, edit)
│   └── who_agent/            # Agent-specific modules
├── config/
│   └── config.exs           # Configuration
├── mix.exs                  # Mix project file
├── README.md                # This file
└── docs/                    # Documentation
```

---

## 💡 Key Features

### Small Models for Local Development

- **Efficient** - Small models fit on consumer hardware
- **Fast** - No network latency to cloud APIs
- **Private** - Your code stays on your machine
- **Cost-effective** - No API costs per token

### Privacy-First

- **No data leaves your machine**
- **No API keys required** (for local models)
- **Full control** over your data and prompts
- **Secure** - No cloud dependencies

### Self-Contained

- **Runs locally** - No cloud dependencies
- **Offline capable** - Once setup, works without internet
- **Portable** - Bring it anywhere
- **Customizable** - Extend with your own tools

---

## 🛠️ Example Usage

### Simple Question

```elixir
{:ok, result} = Alloy.run("What is 2+2?",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  }
)

IO.puts(result.text)
#=> "4"
```

### Agent with Tools

```elixir
{:ok, result} = Alloy.run("Read mix.exs and tell me the dependencies",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  },
  tools: [
    Alloy.Tool.Core.Read,
    Alloy.Tool.Core.Write,
    Alloy.Tool.Core.Bash
  ],
  max_turns: 10
)

IO.puts(result.text)
```

### Continuing a Conversation

```elixir
{:ok, result} = Alloy.run("Now edit that file",
  provider: {Alloy.Provider.OpenAI,
    api_key: System.get_env("OPENAI_API_KEY")
  },
  tools: [
    Alloy.Tool.Core.Read,
    Alloy.Tool.Core.Write,
    Alloy.Tool.Core.Edit
  ],
  messages: previous_result.messages
)

IO.puts(result.text)
```

---

## 🌐 Local Models

### Running Locally

Use local models like:
- **Ollama** (https://ollama.ai/)
- **LM Studio**
- **LocalAI**
- **Anything that implements OpenAI-compatible API**

Example with Ollama:

```elixir
{:ok, result} = Alloy.run("Summarize this code",
  provider: {Alloy.Provider.OpenAI,
    api_key: "ollama",
    api_url: "http://localhost:11434",
    model: "llama3"
  }
)
```

---

## 📚 Documentation

For detailed documentation, see:

- **[USAGE-GUIDE](../USAGE-GUIDE.md)** - Commands and usage
- **[CONFIGURATION](../CONFIGURATION.md)** - Settings and options
- **[IMPLEMENTATION-GUIDE](../IMPLEMENTATION-GUIDE.md)** - Architecture
- **[TROUBLESHOOTING](../TROUBLESHOOTING.md)** - Common issues
- **[MIGRATION](../MIGRATION.md)** - From legacy to Alloy
- **[EXAMPLES](../examples/)** - Real-world configurations

---

## 🎓 Learn More

### Alloy Documentation

- [Alloy Docs](https://hexdocs.pm/alloy/)
- [Alloy GitHub](https://github.com/alloy-ex/alloy)
- [Alloy Examples](https://github.com/alloy-ex/alloy/tree/master/test)

### Local AI Resources

- [Ollama](https://ollama.ai/)
- [LM Studio](https://lmstudio.ai/)
- [LocalAI](https://localai.io/)
- [Text Generation WebUI](https://github.com/oobabooga/text-generation-webui)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

---

## 📜 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

<div align="center">

Made by **zerwiz**

<div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
  <a href="https://github.com/zerwiz/who">
    <img src="https://img.shields.io/badge/GitHub-zerwiz/who-blue.svg" alt="GitHub">
  </a>
  <a href="https://whynotproductions.netlify.app">
    <img src="https://img.shields.io/badge/Website-why" alt="Website">
  </a>
</div>

</div>