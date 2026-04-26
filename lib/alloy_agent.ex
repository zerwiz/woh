defmodule AlloyAgent do
  @moduledoc """
  AlloyAgent is the primary agent team system.

  Provides agent orchestration, memory, state, and session management.
  """

  @moduledoc """
  AlloyAgent is a task orchestrator for multi-agent collaboration.

  Core functionality:
  - Agent lifecycle management
  - Memory and state tracking
  - Team coordination
  - Tool execution
  - Session tracking
  """

  def start_link(opts \\ []) do
    Application.start(:alloy_agent)
    AlloyAgent.Application.start()
  end

  @doc "Starts AlloyAgent"
  def start do
    start_link()
  end

  @doc "Parses agent definition"
  def parse_agent_text(text) do
    AlloyAgent.Definition.parse_agent_text(text)
  end

  @doc "Gets agent by name"
  def agent(name) do
    AlloyAgent.Core.agent(name)
  end

  @doc "Gets all agents"
  def all_agents do
    AlloyAgent.Registry.all_agents
  end

  @doc "Gets all tools"
  def all_tools do
    AlloyAgent.Registry.all_tools
  end
end