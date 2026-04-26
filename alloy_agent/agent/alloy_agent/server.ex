defmodule AlloyAgent.Server do
  @moduledoc """
  GenServer agent wrapper for AlloyAgent.
  
  Provides:
  - Supervision support
  - Message queue management
  - Async cancellation via `cancel_request`
  - Health checks
  - Session export

  ### Usage

      alloy = AlloyAgent.new(%{
        provider: Alloy.Provider.Anthropic,
        config: %{api_key: "ak...", model: "claude-3-5-sonnet-20241022"},
        tools: [{:read, path_validation: true}, ...],
        max_turns: 10,
        max_tokens: 128_000
      })
      {:ok, pid} = Agent.start_link(alloy, name: :my_agent)
      Agent.chat(pid, "Write a function...", timeout: 20_000)
  """

  use GenServer
  use Alloy.Agent.Events

  alias AlloyAgent.Events

  require Logger

  @doc """
  GenServer initialization callback.
  """
  def init(state) do
    {:ok, state}
  end

  @doc """
  Start a chat session with the agent.
  """
  def chat(pid, message, opts \\\\ []) do
    GenServer.cast(pid, {:chat, message, opts})
  end

  @doc """
  Stream a response from the agent.
  """
  def stream_chat(pid, message, opts \\\\ []) do
    GenServer.cast(pid, {:stream_chat, message, opts})
  end

  @doc """
  Cancel an ongoing request by request_id.
  """
  def cancel_request(pid, request_id) do
    GenServer.call(pid, {:cancel_request, request_id})
  end

  @doc """
  Get agent health status.
  """
  def health(pid) do
    GenServer.call(pid, :health)
  end

  @doc """
  Terminate the agent gracefully.
  """
  def terminate(pid) do
    GenServer.call(pid, :terminate)
  end
end
