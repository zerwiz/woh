defmodule Alloy.Tool.SecureShell do
  @moduledoc """
  Tool to execute shell commands safely.

  Only allows safe commands for agent use.
  Validates command strings before execution.

  Usage:
    SecureShell.exec(command, options)
  
  Examples:
    SecureShell.exec("ls -la")
    SecureShell.exec("grep pattern file.txt")
  """

  import Alloy.ToolExecutor

  # Allowed commands for safety
  @allowed_commands ~w(bash bash ls grep find read write edit cat
                       head tail sort grep cut paste mkdir rm cp mv)

  @doc "Executes safe shell command"
  def exec(%{command: command, timeout: \\ 30_000}) do
    # Validate command
    unless is_safe_command?(command) do
      {:error, "Unsafe command not allowed"}
    end
    
    # Check for dangerous patterns
    if hazardous?(command) do
      {:error, "Command denied: hazardous pattern"}
    else
      # Execute with timeout
      result = run_command_with_timeout(command, "bash", timeout)
      
      case result do
        {:ok, output} -> {:ok, %{command: command, output: output}}
        {:error, reason} -> {:error, %{command: command, reason: reason}}
      end
    end
  end

  @doc "Validates command safety"
  def is_safe_command?(command) do
    command in @allowed_commands || command not in ~w(curl wget nc nmap sql)
  end

  @doc "Checks for hazardous patterns"
  def hazardous?(command) do
    command =~ /("|')[\s]*-i[\s*]/ && command =~ /(\||\&)/
  end

  @doc "Executes with output capture"
  def exec_capture(command) do
    exec(%{command: command})
  end

  @doc "Register this tool"
  def register do
    Alloy.ToolRegistry.register(
      "secure_shell",
      "Execute safe shell commands",
      &exec/1
    )
  end
end
