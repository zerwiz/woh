defmodule AlloyAgent.Registry do
  @moduledoc """
  Central registry for agent definitions and team membership.

  Manages all agent definitions and team configurations.
  """

  @default_agents [
    {:architect, %{name: "architect", description: "orchestration", tools: ["bash"], team: "all"}},
    {:builder, %{name: "builder", description: "writer", tools: ["write"], team: "all"}},
    {:scanner, %{name: "scanner", description: "reader", tools: ["read", "ls", "find", "grep", "bash"], team: "all"}},
    {:tester, %{name: "tester", description: "tester", tools: ["bash", "read"], team: "all"}}
  ]

  @default_tools [
    {:read, {:filesystem, "Read files", "Read file content"}, :read},
    {:write, {:filesystem, "Write files", "Write file content"}, :write},
    {:find, {:filesystem, "Find files", "Find files in directory"}, :find},
    {:grep, {:filesystem, "Search files", "Search file content"}, :grep},
    {:ls, {:filesystem, "List directory", "List directory contents"}, :ls},
    {:edit, {:filesystem, "Edit files", "Edit file contents"}, :edit},
    {:bash, {:terminal, "Run bash commands", "Execute bash"}, :bash}
  ]

  @doc "Looks up an agent by name"
  @spec agent(String.t()) :: {:ok, map()} | nil
  def agent(agent_name) do
    Enum.find_value(@default_agents, fn {name, def} ->
      if name == agent_name do
        {:ok, def}
      else
        nil
      end
    end)
  end

  @doc "Looks up a tool by name"
  @spec tool(String.t()) :: {:ok, map()} | nil
  def tool(tool_name) do
    case tool_name do
      "read" ->
        {:ok, %{name: "read", category: :filesystem, description: "Read files"}}

      "write" ->
        {:ok, %{name: "write", category: :filesystem, description: "Write files"}}

      "find" ->
        {:ok, %{name: "find", category: :filesystem, description: "Find files"}}

      "grep" ->
        {:ok, %{name: "grep", category: :filesystem, description: "Search files"}}

      "ls" ->
        {:ok, %{name: "ls", category: :filesystem, description: "List directory"}}

      "edit" ->
        {:ok, %{name: "edit", category: :filesystem, description: "Edit files"}}

      "bash" ->
        {:ok, %{name: "bash", category: :terminal, description: "Run bash commands"}}

      _ ->
        tool_match = Enum.find(@default_tools, fn tool ->
          elem(tool, 0) == tool_name
        end)

        if tool_match do
          {:ok, tool_match}
        else
          nil
        end
    end
  end

  @doc "Gets all agent names"
  def agent_names do
    Enum.map(@default_agents, &elem(&1, 0))
  end

  @doc "Gets all tools"
  def all_tools do
    Enum.map(@default_tools, &elem(&1, 2))
  end

  @doc "Gets tool categories"
  def tool_categories do
    categories = Enum.group_by(@default_tools, fn tool ->
      elem(tool, 1)
    end)

    categories
  end

  @doc "Gets default agent list"
  def default_agents do
    @default_agents
  end

  @doc "Gets default tools list"
  def all_tools_list do
    @default_tools
  end
end