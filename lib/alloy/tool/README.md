# 🛠️ Alloy Tool System

<div align="center">

**Define and implement custom agent tools in Alloy**

</div>

---

## 🎯 About Tools

**Tools** are executable agents that perform specific tasks for the AI agent. Each tool:

- Performs a specific function (gRPC API or shell script)
- Provides a description of what it does
- Returns a structured result (JSON)
- Has defined input and output schemas

### Examples of Custom Tools

- **`file-search`** - Search for files matching criteria
- **`http-client`** - Make REST API calls
- **`docker-exec`** - Execute commands in containers
- **`system-cmd`** - Execute system commands safely
- **`database-query`** - Query databases with validation

---

## 📝 Creating a Tool

### Structure

1. **Create file** in `/lib/alloy/tool/` or subdirectory
2. **Name**: `tool_name.ex` (or `tool_name.sh` for scripts)
3. **Module**: Must start with `Alloy.Tool.` prefix
4. **Format**: Elixir module or shell script

### Tool Example

```elixir
defmodule Alloy.Tool.FindFiles do
  @moduledoc """
  Tool to find files matching patterns.
  
  Usage: find_files(pattern)
  """

  import Alloy.ToolExecutor

  @doc "Finds files matching a pattern"
  def find_files(%{pattern: pattern}) do
    # Your implementation
    {:ok, %{files: file_list}}
  end

  alias Alloy.ToolRegistry

  @doc "Register tool with registry"
  def register do
    ToolRegistry.register(
      "find_files",
      "Find files matching a pattern",
      &find_files/1
    )
  end
end
```

### Registration

Tools can be auto-registered via `Alloy.ToolRegistry`:

```elixir
Application.start(:alloy) do
  Alloy.ToolRegistry.register("find_files", ...)
end
```

---

## 🔧 Tool Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-----|
| `pattern` | string | Pattern to match (regex or glob) |
| `path` | string | Path to search in |
| `recursive` | boolean | Search recursively |
| `limit` | integer | Limit results |
| `case_sensitive` | boolean | Case-sensitive matching |

---

## 📚 Built-in Tools

The Alloy framework provides these built-in tools:

- **File System**: `read`, `write`, `edit`
- **Bash**: `bash`, `grep`, `find`, `ls`
- **HTTP**: `http-client`
- **System**: `system-cmd`, `disk-usage`
- **Container**: `docker-exec`, `k8s-api`
- **Database**: `db-query`, `sql-execute`

---

## 🚀 Extending Tools

### Best Practices

1. **Single Responsibility** - Each tool does one thing well
2. **Type Safety** - Use TypedStruct for inputs/outputs
3. **Error Handling** - Always handle errors gracefully
4. **Documentation** - Document expected inputs/outputs
5. **Testing** - Test tools with sample data

### Example with Error Handling

```elixir
defmodule Alloy.Tool.SecureShell do
  @moduledoc """
  Securely execute shell commands.
  
  Only allows safe commands for agent use.
  """

  import Alloy.ToolExecutor
  import Alloy.Utils.Validation

  @doc "Executes a safe shell command"
  def exec_command(%{command: command}) do
    # Validate command
    unless is_safe_command?(command) do
      {:error, "Unsafe command not allowed"}
    end

    # Execute with timeout
    result = run_command_with_timeout("bash", command, 30_000)
    {:ok, %{output: result}}
  end
end
```

---

## 📜 Shell Script Tools

Tools can also be shell scripts:

```bash
#!/bin/bash
# /lib/alloy/tool/backup.sh

# Find and backup files
BACKUP_DIR="$1"
SOURCE_PATTERN="$2"

if [ -n "$BACKUP_DIR" ]; then
    # Create backup
    find /path -name "$SOURCE_PATTERN" | tar -czf /backup.tar.gz
fi

echo "{\"status\":\"success\",\"backup\":\"complete\"}"
```

---

## 🔐 Tool Security

### Command Validation

```elixir
defmodule Alloy.Tool.Security do
  @allowed_commands ~w(bash grep find ls read write)

  def allowed?(command) do
    command in @allowed_commands
  end
end
```

### File Access Control

```elixir
defmodule Alloy.Tool.FileAccess do
  def allow?(agent, path) do
    # Check agent permissions
    agent.team in %["read", "search"]
  end
end
```

---

## 📖 Related Documentation

- **Skills Documentation**: `/skills/README.md`
- **Tool Executor**: `/lib/alloy/tool/executor.ex`
- **Tool Registry**: `/lib/alloy/tool/registry.ex`

---

<div align="center">

**End of Tool Documentation**

</div>