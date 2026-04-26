defmodule AlloyAgent do
  @moduledoc """
  Multi-agent system for building autonomous AI assistants.

  Core capabilities:
  - 8 Provider types (Anthropic, OpenAI, Google, Ollama, OpenRouter, xAI, DeepSeek, Mistral)
  - 5 Built-in tools (read, write, edit, bash, scratchpad)
  - Streaming responses with provider-level SSE support
  - Mid-session model switching
  - Context compaction (automatic conversation summarization)
  - Context file auto-discovery
  - Skills system with frontmatter parsing
  - Cron/heartbeat scheduler
  - Middleware pipeline
  - Extension events

  Usage:
      alloy = AlloyAgent.new(config)
      alloy.run("Write a function that...", max_turns: 3)
  """

  @type agent() :: struct()
  @type provider() :: atom()
  @type tool() :: atom()

  @doc """
  Create a new AlloyAgent with the given configuration.
  """
  def new(config) do
    struct(AlloyAgent, config)
  end

  @doc """
  Execute a prompt with the agent, optionally streaming.
  """
  def run(agent, prompt, opts \\\\ []) do
    # Implementation of the agent loop
    Agent.run(agent, prompt, opts)
  end

  @doc """
  Stream a response from the agent.
  """
  def stream(agent, prompt, opts \\\\ []) do
    # Implementation of streaming responses
    # Returns chunks via callback or :streaming option
  end
end
