use Mix.Config

# AlloyAgent configuration
config :alloy_agent, AlloyAgent,
  root_path: Path.dirname(File.dirname(__DIR__)),
  agent_dir: "lib/alloy_agent/definition",
  default_team: "all",
  tools: AlloyAgent.Tools.list_tool(),
  default_tools: AlloyAgent.Tools.list_tool(),
  default_agents: ["architect", "builder", "scanner", "tester"]

config :agent_supervisor, AlloyAgent.Supervisor,
  default_opts: [name: "agent"]

config :agent_registry, AlloyAgent.Registry,
  default_opts: [%{}]

config :agent_tools, AlloyAgent.Tools,
  available_tools: AlloyAgent.Tools.list_tool()
