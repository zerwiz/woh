defmodule AlloyAgent.Team do
  @moduledoc """
  Team coordinator module for the Pi agent team.

  Manages team membership, operations, and coordination.
  """

  @typedoc "Team struct"
  defstruct [
    :name,         # Team name
    :members,      # List of team member names
    :ops,          # Team operations
    :session,      # Current team session
    :created_at    # Team creation timestamp
  ]

  @doc "Creates a new team"
  def create(name, members \\ []) do
    %__MODULE__{
      name: name,
      members: members,
      ops: %{},
      session: nil,
      created_at: NaiveDateTime.utc_now()
    }
  end

  @doc "Gets team members"
  def get_members(team) do
    team.members
  end

  @doc "Adds a member to the team"
  def add_member(team, member) do
    Map.put(team, :members, team.members ++ [member])
  end

  @doc "Removes a member from the team"
  def remove_member(team, member) do
    team.members -- [member]
    |> then(fn members ->
      Map.put(team, :members, members)
    end)
  end

  @doc "Gets team info"
  def info(team) do
    %{
      name: team.name,
      members: team.members,
      created_at: team.created_at
    }
  end

  @doc "Gets team operations"
  def get_ops(team) do
    team.ops
  end

  @doc "Add operation to team"
  def add_op(team, op, payload) do
    Map.put(team, :ops, Map.put(team.ops, op, payload))
  end

  @doc "Gets session for team"
  def get_session(team) do
    team.session
  end

  @doc "Sets session for team"
  def set_session(team, session) do
    Map.put(team, :session, session)
  end
end