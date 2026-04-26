defmodule AlloyAgent.Events do
  @moduledoc """
  Protocol loop for agent event handling.
  
  Manages:
  - Turn lifecycle events
  - Tool call/start/end events
  - Request cancellation
  - Context compaction hooks

  The protocol loop calls `Alloy.Agent.Events` internally, so this handles the
  async dispatch pattern for long-running turns.
  """

  use Behaviour

  alias Alloy.Agent.Events

  require Logger

  @doc """
  Callback to handle agent events in the turn loop.
  """
  @callback handle_info {:agent_event, message} -> {:noreply, State.t()}
  @callback handle_info _ -> {:stop, reason}

  @doc """
  Emit lifecycle events for the run lifecycle.
  """
  def emit_run_event(module, :start) do
    Events.emit([:alloy, :run, :start])
  end

  def emit_run_event(module, :stop) do
    Events.emit([:alloy, :run, :stop])
  end

  @doc """
  Emit events for individual turn lifecycle.
  """
  def emit_turn_event(module, :start) do
    Events.emit([:alloy, :turn, :start])
  end

  def emit_turn_event(module, :stop) do
    Events.emit([:alloy, :turn, :stop])
  end

  @doc """
  Emit events for provider requests.
  """
  def emit_provider_event(module, :request) do
    Events.emit([:alloy, :provider, :request])
  end

  @doc """
  Emit events after compaction completes.
  """
  def emit_compaction_event(module, :done) do
    Events.emit([:alloy, :compaction, :done])
  end
end
