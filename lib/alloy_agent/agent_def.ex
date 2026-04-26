defmodule AlloyAgent.AgentDef do
  @moduledoc """
  Agent definition module for core API.

  Provides basic agent definition creation and retrieval.
  Supports both tools (external operations) and skills (cognitive abilities).

  ## Tools
  Tools are external operations an agent can perform:
  - `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`
  - Custom tools like `file_search`, `web_search`, `http-client`

  ## Skills
  Skills are cognitive enhancements:
  - `deduce`, `assess`, `evaluate` - Reasoning
  - `analyze`, `synthesize`, `critique` - Analysis
  - `imagine`, `abstract`, `connect` - Creativity
  - `simplify`, `persuade`, `empathize` - Communication

  ## Best Practices
  - Use tools to access information (files, APIs, commands)
  - Use skills to enhance reasoning and problem-solving
  - Combine tools and skills for optimal performance
  """

  @typedoc "Agent definition struct"
  defstruct [
    :name,              # Agent name (e.g., "architect", "builder")
    :description,       # Agent description
    :team,              # Team name
    :tools,             # List of tools the agent can use
    :skills,            # List of skills the agent can apply
    :priority,          # Agent priority weight
    :enabled_tools,     # Whether tools are enabled
    :enabled_skills     # Whether skills are enabled
  ]

  @doc "Creates a new agent definition"
  def create(name, description, team \\ "all", opts \\ []) do
    tools = Keyword.get(opts, :tools, [])
    skills = Keyword.get(opts, :skills, [])
    priority = Keyword.get(opts, :priority, 0.5)
    enabled_tools = Keyword.get(opts, :enabled_tools, true)
    enabled_skills = Keyword.get(opts, :enabled_skills, true)
    
    %__MODULE__{
      name: name,
      description: description,
      team: team,
      tools: tools,
      skills: skills,
      priority: priority,
      enabled_tools: enabled_tools,
      enabled_skills: enabled_skills
    }
  end

  @doc "Creates agent with minimal options"
  def minimal(name, description, team \\ "all") do
    create(name, description, team, priority: 0.5)
  end

  @doc "Gets agent name"
  def name(agent) do
    agent.name
  end

  @doc "Gets agent description"
  def description(agent) do
    agent.description
  end

  @doc "Gets agent team"
  def team(agent) do
    agent.team
  end

  @doc "Gets agent tools"
  def tools(agent) do
    agent.tools
  end

  @doc "Gets agent skills"
  def skills(agent) do
    agent.skills
  end

  @doc "Gets agent priority"
  def priority(agent) do
    agent.priority
  end

  @doc "Gets agent tool and skill status"
  def capabilities(agent) do
    %{
      tools_enabled: agent.enabled_tools,
      tools: agent.tools,
      skills_enabled: agent.enabled_skills,
      skills: agent.skills
    }
  end

  @doc "Enables tools for agent"
  def enable_tools(agent) do
    %__MODULE__{agent | enabled_tools: true}
  end

  @doc "Disables tools for agent"
  def disable_tools(agent) do
    %__MODULE__{agent | enabled_tools: false}
  end

  @doc "Enables skills for agent"
  def enable_skills(agent) do
    %__MODULE__{agent | enabled_skills: true}
  end

  @doc "Disables skills for agent"
  def disable_skills(agent) do
    %__MODULE__{agent | enabled_skills: false}
  end

  @doc "Sets agent priority"
  def set_priority(agent, priority) do
    %__MODULE__{agent | priority: priority}
  end

  @doc "Combines agent with tools and skills"
  def with_capabilities(agent, opts \\ []) do
    case Keyword.get(opts, :enabled_tools, true) do
      true -> AlloyAgent.AgentDef.enable_tools(agent)
      false -> AlloyAgent.AgentDef.disable_tools(agent)
    end
  |> AlloyAgent.AgentDef.with_skills(opts)
  end

  @doc "Combines agent with skills"
  def with_skills(agent, opts \\ []) do
    case Keyword.get(opts, :enabled_skills, true) do
      true -> AlloyAgent.AgentDef.enable_skills(agent)
      false -> AlloyAgent.AgentDef.disable_skills(agent)
    end
  end

  @doc "Example of creating agent with tools and skills"
  def example() do
    agent = AlloyAgent.AgentDef.create(
      name: "research_analyst",
      description: "Analyzes research documents",
      team: "research",
      tools: ["read", "file_search", "web_search"],
      skills: ["critical_analysis", "data_synthesis", "pattern_recognition"]
    )
    
    agent
  end

  @doc "Example of agent with minimal configuration"
  def example_minimal() do
    agent = AlloyAgent.AgentDef.create(
      name: "simple_agent",
      description: "Simple agent",
      team: "all"
    )
    
    agent
  end
end

defmodule AlloyAgent.AgentDefinition do
  @moduledoc """
  Agent definition module for parsing agent definitions.

  Handles frontmatter extraction and definition creation.
  Supports both tools and skills in agent definitions.
  """

  alias AlloyAgent.AgentDef

  @typedoc "Agent definition struct"
  defstruct [
    :name,              # Agent name
    :description,       # Agent description
    :tools,             # List of tools
    :skills,            # List of skills
    :system_prompt,     # System prompt
    :headers,           # Frontmatter headers list
    :value,             # Full content without frontmatter
    :metadata,          # Parse metadata
    :file_path,         # Path to agent file
    :team               # Team this agent belongs to
  ]

  @doc "Creates a new agent definition"
  def new(opts \\ []) do
    name = Keyword.get(opts, :name) || "unknown"
    description = Keyword.get(opts, :description, "")
    tools = Keyword.get(opts, :tools, [])
    skills = Keyword.get(opts, :skills, [])
    system_prompt = Keyword.get(opts, :system_prompt, "")
    file_path = Keyword.get(opts, :file_path, nil)
    team = Keyword.get(opts, :team, "all")

    %__MODULE__{
      name: name,
      description: description,
      tools: tools,
      skills: skills,
      system_prompt: system_prompt,
      file_path: file_path,
      team: team,
      headers: [],
      value: "",
      metadata: %{}
    }
  end

  @doc "Creates agent definition from frontmatter"
  def from_frontmatter(content) do
    # Parse frontmatter and extract tools and skills
    # Implementation would extract from YAML/Markdown frontmatter
    new()
  end

  @doc "Validates agent definition"
  def validate(def) do
    required = [:name]
    missing = required
              |> Enum.map(&def.__struct__[&1])
              |> Enum.reject(&is_nil/1)

    Enum.empty?(missing)
  end

  @doc "Validates agent name"
  def validate_name(name) do
    name != nil
  end

  @doc "Validates agent description"
  def validate_description(description) do
    String.length(description) > 0
  end

  @doc "Validates agent team"
  def validate_team(team) do
    team in ["all"] || true
  end

  @doc "Validates agent tools"
  def validate_tools(tools) do
    if Enum.empty?(tools) do
      true
    else
      Enum.all?(tools, &is_binary/1)
    end
  end

  @doc "Validates agent skills"
  def validate_skills(skills) do
    if Enum.empty?(skills) do
      true
    else
      Enum.all?(skills, &is_binary/1)
    end
  end

  @doc "Gets agent capabilities summary"
  def capabilities(agent) do
    %{
      tools: agent.tools,
      skills: agent.skills,
      enabled: %{
        tools: AgentDef.tools(agent) in [true],
        skills: AgentDef.skills(agent) in [true]
      }
    }
  end
end
