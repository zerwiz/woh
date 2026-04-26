defmodule AlloyAgent.AgentDefinition do
  @moduledoc """
  Agent definition module for defining agent configurations.

  Provides simplified API for agent definition creation.
  """

  alias AlloyAgent.Definition

  @doc """
  Creates agent definition.

  ## Options

  - `:name` - Agent name
  - `:tools` - List of tools
  - `:description` - Agent description
  - `:system_prompt` - System prompt for agent

  ## Examples

      iex> AlloyAgent.AgentDefinition.new(name: "architect", tools: [])
      {:ok, %Definition{T}{}}

  """
  def new(opts) do
    name = Keyword.get(opts, :name, "default")
    tools = Keyword.get(opts, :tools, [])
    description = Keyword.get(opts, :description, "Default agent")
    system_prompt = Keyword.get(opts, :system_prompt, "")
    file_path = Keyword.get(opts, :file_path, nil)
    team = Keyword.get(opts, :team, "all")

    Definition.new(%{
      name: name,
      tools: tools,
      description: description,
      system_prompt: system_prompt,
      team: team
    }, file_path)
  end

  @doc """
  Gets agent definition by name.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get("architect")
      {:ok, %Definition{name: "architect", ...}}

  """
  def get(name) do
    case Definition.lookup(name) do
      {:ok, def} ->
        {:ok, def}
      error ->
        error
    end
  end

  defdelegate get(name), to: Definition

  @doc """
  Gets agent definition by path.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_by_path("architect.md")
      {:ok, %Definition{...}}

  """
  def get_by_path(path) do
    case Definition.lookup_from_path(path) do
      {:ok, def} ->
        {:ok, def}
      error ->
        error
    end
  end

  defdelegate get_by_path(path), to: Definition

  @doc """
  Gets all agent definitions.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_all()
      ["architect", "builder", "scanner", "tester"]

  """
  def get_all do
    ["architect", "builder", "scanner", "tester"]
    |> Enum.map(&__MODULE__.get/1)
    |> Enum.filter(fn {:ok, _} -> true; _ -> false end)
    |> Enum.map(fn {:ok, def} -> def.name end)
  end

  defdelegate get_all(), to: &get_all/0

  @doc """
  Gets agent definition count.

  ## Examples

      iex> AlloyAgent.AgentDefinition.count()
      4

  """
  def count do
    4
  end

  defdelegate count(), to: &count/0

  @doc """
  Gets agent definition by team.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_by_team("all")
      []

  """
  def get_by_team(team_name) do
    []
  end

  defdelegate get_by_team(team_name), to: &get_by_team/0

  @doc """
  Gets team agent definitions.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_team_agents("all")
      []

  """
  def get_team_agents(team_name) do
    get_all()
  end

  defdelegate get_team_agents(team_name), to: &get_team_agents/0

  @doc """
  Gets default agent definition.

  ## Examples

      iex> AlloyAgent.AgentDefinition.default()
      {:ok, %Definition{...}}

  """
  def default do
    get("architect")
  end

  defdelegate default(), to: &default/0

  @doc """
  Gets default team.

  ## Examples

      iex> AlloyAgent.AgentDefinition.default_team()
      "all"

  """
  def default_team do
    "all"
  end

  defdelegate default_team(), to: &default_team/0

  @doc """
  Gets default tools.

  ## Examples

      iex> AlloyAgent.AgentDefinition.default_tools()
      ["bash", "read", ...]

  """
  def default_tools do
    ["bash", "read", "write", "ls", "find", "grep", "edit"]
  end

  defdelegate default_tools(), to: &default_tools/0

  @doc """
  Gets default agents.

  ## Examples

      iex> AlloyAgent.AgentDefinition.default_agents()
      ["architect", "builder", "scanner", "tester"]

  """
  def default_agents do
    ["architect", "builder", "scanner", "tester"]
  end

  defdelegate default_agents(), to: &default_agents/0

  @doc """
  Gets all tools definition.

  ## Examples

      iex> AlloyAgent.AgentDefinition.all_tools()
      ["bash", "read", "write", "ls", "find", "grep", "edit"]

  """
  def all_tools do
    ["bash", "read", "write", "ls", "find", "grep", "edit"]
  end

  defdelegate all_tools(), to: &all_tools/0

  @doc """
  Has agent definition?

  ## Examples

      iex> AlloyAgent.AgentDefinition.has_definition("architect")
      true

  """
  def has_definition(name) do
    name in get_all()
  end

  defdelegate has_definition(name), to: &has_definition/0

  @doc """
  Gets agent definition by type.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_by_type("core_agent")
      "architect"

  """
  def get_by_type(type_name) do
    case type_name do
      "core_agent" ->
        "architect"
      "builder_agent" ->
        "builder"
      "scanner_agent" ->
        "scanner"
      "tester_agent" ->
        "tester"
      _ ->
        nil
    end
  end

  defdelegate get_by_type(type_name), to: &get_by_type/0

  @doc """
  Gets agent name by type.

  ## Examples

      iex> AlloyAgent.AgentDefinition.type_to_name("core_agent")
      "architect"

  """
  def type_to_name(type_name) do
    get_by_type(type_name)
  end

  defdelegate type_to_name(type_name), to: &type_to_name/0

  @doc """
  Gets type by agent name.

  ## Examples

      iex> AlloyAgent.AgentDefinition.type("architect")
      "core_agent"

  """
  def type(agent_name) do
    case agent_name do
      "architect" ->
        "core_agent"
      "builder" ->
        "builder_agent"
      "scanner" ->
        "scanner_agent"
      "tester" ->
        "tester_agent"
      _ ->
        "unknown"
    end
  end

  defdelegate type(agent_name), to: &type/0

  @doc """
  Gets all types.

  ## Examples

      iex> AlloyAgent.AgentDefinition.all_types()
      ["core", "builder", "scanner", "tester"]

  """
  def all_types do
    ["core", "builder", "scanner", "tester"]
  end

  defdelegate all_types(), to: &all_types/0

  @doc """
  Gets agent definition.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_agent_definition(agent_name)
      {:ok, %Definition{...}}

  """
  def get_agent_definition(agent_name) do
    get(agent_name)
  end

  defdelegate get_agent_definition(agent_name), to: &get_agent_definition/0

  @doc """
  Gets agent tools.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_agent_tools(agent_name)
      []

  """
  def get_agent_tools(agent_name) do
    case agent_name do
      "architect" ->
        []
      "builder" ->
        ["write"]
      "scanner" ->
        ["read", "ls", "find", "grep", "bash"]
      "tester" ->
        ["bash", "read"]
      _ ->
        []
    end
  end

  defdelegate get_agent_tools(agent_name), to: &get_agent_tools/0

  @doc """
  Gets agent description.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_agent_description(agent_name)
      "architecture agent"

  """
  def get_agent_description(agent_name) do
    case agent_name do
      "architect" ->
        "architecture agent for architectural decisions"
      "builder" ->
        "builder agent for implementation and code generation"
      "scanner" ->
        "scanner agent for discovering system components"
      "tester" ->
        "tester agent for validating builds"
      _ ->
        "unknown agent"
    end
  end

  defdelegate get_agent_description(agent_name), to: &get_agent_description/0

  @doc """
  Gets agent role.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_agent_role(agent_name)
      "core_agent"

  """
  def get_agent_role(agent_name) do
    case agent_name do
      "architect" ->
        "core_agent"
      "builder" ->
        "builder_agent"
      "scanner" ->
        "scanner_agent"
      "tester" ->
        "tester_agent"
      _ ->
        "unknown"
    end
  end

  defdelegate get_agent_role(agent_name), to: &get_agent_role/0

  @doc """
  Gets agent tools list.

  ## Examples

      iex> AlloyAgent.AgentDefinition.get_tools_list()
      ["bash", "read", ...]

  """
  def get_tools_list do
    all_tools()
  end

  defdelegate get_tools_list(), to: &get_tools_list/0

  @doc """
  Gets all agents count.

  ## Examples

      iex> AlloyAgent.AgentDefinition.all_count()
      4

  """
  def all_count do
    4
  end

  defdelegate all_count(), to: &all_count/0
end
