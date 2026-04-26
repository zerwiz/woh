# Running the Alloy Agent

## Prerequisites

- **Elixir** (Erlang/OTP) - Must be installed
- **mix** - Elixir build tool

## Quick Start

### Option 1: Using the Launcher Script

```bash
cd /home/zerwiz/woh/alloy_agent

# Run the start script
./start.sh
```

The `start.sh` script will:
1. Check for Elixir installation
2. Verify directory structure
3. Compile the agent code
4. Run the application

### Option 2: Manual Start

```bash
cd /home/zerwiz/woh/alloy_agent

# Compile
mix compile

# Run with mix
mix run lib/alloy_agent.ex
```

### Option 3: Interactive Elixir

```bash
# Start IEx shell
iex -S mix

# From IEx, start the application
AlloyAgent.Application.start()
```

## Required Files

The following files/directories must exist:

```
alloy_agent/
├── lib/
│   └── alloy_agent.ex   # Main entry point
├── mix.exs            # Project definition
├── mix.lock          # Dependencies (or run mix deps.get)
└── start.sh         # Launcher script
```

## Configuration

### Setting up mix.exs

Create `mix.exs` in the alloy_agent directory:

```elixir
defmodule AlloyAgent.MixProject do
  use Mix.Project

  def project do
    [
      app: :alloy_agent,
      version: "0.1.0",
      elixir: "~> 1.15",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {AlloyAgent.Application, []}
    ]
  end

  defp deps do
    [
      # Add your dependencies here
    ]
  end
end
```

### Environment Variables

```bash
# Set API key for provider
export ANTHROPIC_API_KEY="sk-ant-..."

# Set working directory
export ALLOY_WORKING_DIR="/home/zerwiz/woh"
```

## Common Issues

### "mix: command not found"

Install Elixir:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install elixir

# Or via asdf
asdf install elixir latest
asdf global elixir latest
```

### "No mix.exs found"

Create a mix.exs file in the alloy_agent directory, then run:
```bash
mix deps.get
```

### "module AlloyAgent.Memory is not available"

Ensure dependencies are installed:
```bash
mix deps.get
mix compile
```

### "Could not start application"

Check the supervision tree in `application.ex`:
```elixir
def start(_type, _args) do
  children = [
    AlloyAgent.Memory,
    AlloyAgent.Registry,
    AlloyAgent.TEAM.Supervisor
  ]
  Supervisor.start_link(children, strategy: :one_for_one, name: AlloyAgent)
end
```

## Programming the Agent

### Basic Usage

```elixir
# Start the application
AlloyAgent.Application.start(:normal, [])

# Get an agent
agent = AlloyAgent.Registry.agent("architect")

# Get agent info
IO.inspect(AlloyAgent.Agent.agent("architect"))

# Get agent tools
IO.inspect(AlloyAgent.Agent.tools("scanner"))
# => ["read", "ls", "find", "grep", "bash"]
```

### Creating Custom Agents

```elixir
# Define an agent
custom_agent = AlloyAgent.AgentDef.create(
  "my_agent",
  "Custom agent description",
  "my_team",
  tools: ["read", "write", "bash"],
  skills: ["analyze"],
  priority: 0.8
)

# Create a session
session = AlloyAgent.Session.new(
  agent: "my_agent",
  max_turns: 10
)
```

### Running Tasks

```elixir
# Create state for agent
state = AlloyAgent.State.new("architect")

# Start a task
state = AlloyAgent.State.start_task(state, "analyze codebase", [])

# Process turns
state = AlloyAgent.State.next_turn(state, [])

# Finish task
state = AlloyAgent.State.finish(state, "Analysis complete")
```

## Agent Communication

```elixir
# Create team
team = AlloyAgent.Team.create("project", ["architect", "builder", "scanner"])

# Add team members
team = AlloyAgent.Team.add_member(team, "tester")

# Get team info
team_info = AlloyAgent.Team.info(team)
```

## Monitoring

```elixir
# Check supervisor state
Supervisor.count_children(AlloyAgent.Supervisor)

# Get process status
AlloyAgent.Supervisor.running?(supervisor)
AlloyAgent.Supervisor.get_status(supervisor)
```

## Stopping

```bash
# In IEx
# Press Ctrl+C twice to exit
# Or call:
System.halt(0)
```

## Next Steps

- [API Reference](API.md) - Complete module documentation
- [CONFIG.md](config.md) - Configuration options
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture