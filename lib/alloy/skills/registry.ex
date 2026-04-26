defmodule Alloy.SkillRegistry do
  @moduledoc """
  Registry for skill definitions and operations.

  Manages skill registration, lookup, and activation.
  Supports both built-in and custom skills.

  ## Built-in Skills

  - **Reasoning**: `deduce`, `assess`, `evaluate`
  - **Analysis**: `analyze`, `breakdown`, `synthesize`
  - **Creativity**: `imagine`, `abstract`, `connect`
  - **Communication**: `simplify`, `persuade`, `empathize`

  ## Registration

  Skills can be registered dynamically:

      Alloy.SkillRegistry.register("analyze", "Analyze data", &analyze/1)
  """

  @type skill :: %{
    name => String.t()
    description => String.t()
    handler => (map() -> {:ok, any()} | {:error, any})
    priority => float,
    enabled => boolean
  }

  @type registered_skills :: %{
    binary() => skill
  }

  @registry AgentSKill.Registry
  @builtin_skills [
    %{name: "deduce", description: "Logical deduction", handler: &Alloy.Skill.Deduce.deduce/1},
    %{name: "analyze", description: "Data analysis", handler: &Alloy.Skill.Analyze.analyze/1},
    %{name: "synthesize", description: "Information synthesis", handler: &Alloy.Skill.Synthesis.synthesize/1},
    %{name: "imagine", description: "Creativity and ideation", handler: &Alloy.Skill.Imagine.imagine/1},
    %{name: "assess", description: "Evaluation and assessment", handler: &Alloy.Skill.Assess.assess/1}
  ]

  @doc "Registers a new skill"
  def register(name, description, handler, opts \\ []) do
    priority = Keyword.get(opts, :priority, 0.5)
    enabled = Keyword.get(opts, :enabled, true)

    skill = %{
      name: name,
      description: description,
      handler: handler,
      priority: priority,
      enabled: enabled
    }

    # Add to registry
    Map.put(@registry, name, skill)
  end

  @doc "Gets all registered skills"
  def all do
    @registry
  end

  @doc "Gets registered skill by name"
  def get(name) do
    Map.get(@registry, name)
  end

  @doc "Executes registered skill"
  def execute(skill_name, input) do
    skill = Map.get(@registry, skill_name)

    if skill do
      {:ok, skill.handler.(input)}
    else
      {:error, {:skill_not_found, skill_name}}
    end
  end

  @doc "Enables skill"
  def enable(name) do
    skill = Map.get(@registry, name)

    if skill do
      Map.put(skill, :enabled, true)
    else
      nil
    end
  end

  @doc "Disables skill"
  def disable(name) do
    skill = Map.get(@registry, name)

    if skill do
      Map.put(skill, :enabled, false)
    else
      nil
    end
  end

  @doc "Gets enabled skills"
  def enabled do
    @registry
    |> Map.filter(fn skill -> skill.enabled == true end)
  end

  @doc "Gets disabled skills"
  def disabled do
    @registry
    |> Map.filter(fn skill -> skill.enabled == false end)
  end

  @doc "Gets skill handler"
  def handler(skill_name) do
    skill = Map.get(@registry, skill_name)

    if skill do
      skill.handler
    else
      nil
    end
  end

  @doc "Register built-in skills"
  def register_builtin do
    for %{name: name, handler: handler} <- @builtin_skills do
      register(name, handler.name, handler)
    end
  end

  @doc "Available skills list"
  def available do
    @builtin_skills
    |> Enum.map(fn skill -> skill.name end)
  end

  @doc "Check if skill exists"
  def available?(name) do
    key = Map.get(@registry, name)
    key || true
  end

  @doc "Reset registry"
  def reset do
    @registry
  end
end
