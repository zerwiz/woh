defmodule AlloyAgent.Core do
  @moduledoc """
  Core agent functions for the Pi agent team.

  Provides orchestration, memory, state, and session management.
  """

  defmodule T do
    @type t :: struct()

    defstruct [:agents, :memory, :teams, :tools]
  end

  alias AlloyAgent.Definition
  alias AlloyAgent.AgentDef
  alias AlloyAgent.Memory
  alias AlloyAgent.Session
  alias AlloyAgent.Team
  alias AlloyAgent.Registry

  alias AlloyAgent.Core

  @doc "Gets agent info"
  def agent(name) do
    case Registry.agent(name) do
      {:ok, def} ->
        %{
          name: def.name,
          description: def.description,
          tools: def.tools,
          system_prompt: def.system_prompt,
          team: def.team
        }

      nil ->
        nil
    end
  end

  @doc "Gets agent description"
  def description(agent) do
    AgentDef.description(agent)
  end

  @doc "Gets agent tools"
  def tools(agent) do
    AgentDef.tools(agent)
  end

  @doc "Gets agent memory"
  def get_memory(agent) do
    Memory.get(agent.name, :memory)
  end

  @doc "Puts memory for agent"
  def put_memory(agent, key, value) do
    Memory.put(agent.name, key, value)
  end

  @doc "Gets agent state"
  def state(agent) do
    Case.new(agent.name)
  end

  @doc "Gets agent session"
  def session(agent) do
    Session.get(agent.name)
  end

  @doc "Creates a new agent session"
  def new_session(agent, max_turns: nil) do
    Session.new(
      agent: agent.name,
      max_turns: max_turns
    )
  end

  @doc "Gets team info"
  def team(team_name) do
    case Registry.get_team_info(team_name) do
      {:ok, team_info} ->
        team_info

      nil ->
        Team.create(team_name, [])
    end
  end

  @doc "Gets tool info"
  def tool(tool_name) do
    case Registry.tool(tool_name) do
      {:ok, info} ->
        info

      nil ->
        nil
    end
  end

  @doc "Gets memory info"
  def memory_info(key) do
    case Memory.get(key) do
      {:ok, value} ->
        value

      nil ->
        nil
    end
  end

  @doc "Parse agent definition"
  def parse_agent_text(text) do
    Definition.parse_agent_text(text)
  end

  @doc "Parse agent definition from file"
  def parse_agent_file(file_path) do
    Definition.parse_agent_file(file_path)
  end
end