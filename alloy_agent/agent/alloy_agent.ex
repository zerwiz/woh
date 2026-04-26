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
    
    defmodule AlloyAgent.Agent do
      @moduledoc """
      Core agent operations module.
    
      Provides agent info, memory, state, and session management.
      """
    
      alias AlloyAgent.AgentDef
      alias AlloyAgent.AgentDefinition
      alias AlloyAgent.Memory
      alias AlloyAgent.Session
      alias AlloyAgent.State
      alias AlloyAgent.Team
    
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
        Memory.memory(agent)
      end
    
      @doc "Puts memory for agent"
      def put_memory(agent, key, value) do
        Memory.put(agent, key, value)
      end
    
      @doc "Gets agent state"
      def state(agent) do
        State.new(agent)
      end
    
      @doc "Gets agent session"
      def session(agent) do
        Session.get(agent)
      end
    
      @doc "Creates a new agent session"
      def new_session(agent) do
        Session.new(agent: agent.name)
      end
    
      @doc "Gets team info for agent"
      def team(team) do
        Team.create(team, [])
      end
    
      @doc "Gets tool info"
      def tool(tool) do
        Registry.tool(tool)
      end
    end
    
  end
end