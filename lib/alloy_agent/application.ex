defmodule AlloyAgent.Application do
  @moduledoc """
  AlloyAgent application supervision tree.

  Manages all agents, teams, and memory.
  """

  use Application

  def start(_type, _args) do
    children = [
      AlloyAgent.Memory,
      AlloyAgent.Registry,
      AlloyAgent.TEAM.Supervisor
    ]

    options = [
      strategy: :one_for_one,
      name: AlloyAgent
    ]

    Supervisor.start_link(children, options)
  end

  def child_spec(child) do
    child
  end
end

defmodule AlloyAgent.TEAM.Supervisor do
  @moduledoc "API for managing agents"

  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(opts) do
    children = [
      AlloyAgent.Agent.Architect,
      AlloyAgent.Agent.Builder,
      AlloyAgent.Agent.Scanner,
      AlloyAgent.Agent.Tester
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end

defmodule AlloyAgent.Agent.Architect do
  @moduledoc "Core orchestration agent"

  def start_link do
    GenServer.start_link(__MODULE__, :idle, name: AlloyAgent.Agent.Architect)
  end

  def info do
    %AlloyAgent.Agent.T{
      name: "architect",
      description: "Core orchestration agent",
      team: "all",
      tools: ["bash"]
    }
  end
end

defmodule AlloyAgent.Agent.T do
  @moduledoc "Agent struct"

  defstruct [:agent, :status, :name, :description, :team, :tools]
end