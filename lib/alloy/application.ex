defmodule Alloy.Application do
  @moduledoc false

  use Application

  @impl Application
  def start(_type, _args) do
    children =
      [
        {Task.Supervisor, name: Alloy.TaskSupervisor}
      ] ++ maybe_pubsub()

    Supervisor.start_link(children, strategy: :one_for_one, name: Alloy.Supervisor)
  end

  @doc """
  Configure AlloyAgent for automatic agent team boot on startup.

  This hook is called when 'woh' is run in the terminal. It ensures:
  - Agent team registry is initialized
  - Team configuration is loaded from ~/.pi/agents/teams.yaml
  - Default team is activated
  - Agent sessions directory is created

  Usage in Mixfile:
  ```elixir
  def application do
    [
      mod: {Alloy.Application, [
        team: [
          enabled: true,
          teams_path: Path.join(System.tmp_dir!(), ".pi", "agents", "teams.yaml"),
          session_dir: Path.join(System.tmp_dir!(), ".pi", "agent-sessions")
        ]
      ]}
    ]
  end
  ```
  """
  def start_with_agent_team(type, args) do
    opts = Keyword.get(args, :team, %{})
    enabled = Keyword.get(opts, :enabled, true)

    if enabled do
      # Load agent definitions and initialize team system
      AlloyAgent.Registry.initialize(opts)
      AlloyAgent.Memory.Supervisor.start_link()
      AlloyAgent.Team.Supervisor.start_link()

      # Create session directory for agent persistence
      session_dir = Keyword.get(opts, :session_dir, Path.join(System.tmp_dir!(), ".pi", "agent-sessions"))
      File.mkdir_p!(session_dir)
    end

    start(type, args)
  end

  # Start a local PubSub only when the user explicitly opts in via
  # `config :alloy, pubsub: Alloy.PubSub` (or any module name).
  # If phoenix_pubsub is not available, skip silently.
  defp maybe_pubsub do
    case Application.get_env(:alloy, :pubsub) do
      nil ->
        []

      name when is_atom(name) ->
        if Code.ensure_loaded?(Phoenix.PubSub) do
          [{Phoenix.PubSub, name: name}]
        else
          []
        end
    end
  end
end
