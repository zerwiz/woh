defmodule AlloyAgent.State do
  @moduledoc """
  Agent runtime state management.

  Tracks agent lifecycle: status, task, tools, elapsed time, output.
  Supports task transitions and error handling.
  """

  @doc "Creates a new agent state"
  def new(agent_id) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: agent_id,
      status: :idle,
      task: nil,
      tools: %{},
      elapsed_ms: 0,
      output: "",
      turn: 0,
      max_turns: nil,
      started_at: now,
      completed_at: nil
    }
  end

  @doc "Starts a new task for the agent"
  def start_task(state, _task, _opts \\ []) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: state.agent,
      status: :running,
      task: state.task,
      tools: state.tools,
      elapsed_ms: state.elapsed_ms,
      output: state.output,
      turn: state.turn,
      max_turns: state.max_turns,
      started_at: now,
      completed_at: nil
    }
  end

  @doc "Records tool usage"
  def record_tool(state, tool_id, _opts \\ []) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: state.agent,
      status: state.status,
      task: state.task,
      tools: Map.update(state.tools, tool_id, 0, &(&1 + 1)),
      elapsed_ms: state.elapsed_ms,
      output: state.output,
      turn: state.turn,
      max_turns: state.max_turns,
      start_time: now,
      completed_at: state.completed_at
    }
  end

  @doc "Increments turn counter"
  def next_turn(state, _opts \\ []) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: state.agent,
      status: state.status,
      task: state.task,
      tools: state.tools,
      elapsed_ms: state.elapsed_ms,
      output: state.output,
      turn: state.turn + 1,
      max_turns: state.max_turns,
      start_time: now,
      completed_at: state.completed_at
    }
  end

  @doc "Finishes the agent task"
  def finish(state, _output \\ "") do
    now = NaiveDateTime.utc_now()

    case state.max_turns && state.turn >= state.max_turns do
      true ->
        %__MODULE__.T{
          agent: state.agent,
          status: :max_turns_reached,
          task: state.task,
          tools: state.tools,
          elapsed_ms: state.elapsed_ms,
          output: state.output,
          turn: state.turn,
          max_turns: state.max_turns,
          started_at: state.started_at,
          completed_at: now
        }

      _ ->
        %__MODULE__.T{
          agent: state.agent,
          status: :completed,
          task: state.task,
          tools: state.tools,
          elapsed_ms: state.elapsed_ms,
          output: state.output <> _output,
          turn: state.turn,
          max_turns: state.max_turns,
          started_at: state.started_at,
          completed_at: now
        }
    end
  end

  @doc "Errors the agent"
  def error(state, error) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: state.agent,
      status: :error,
      task: state.task,
      tools: state.tools,
      elapsed_ms: state.elapsed_ms,
      output: state.output <> "\n[ERROR] #{inspect(error)}",
      turn: state.turn,
      max_turns: state.max_turns,
      started_at: state.started_at,
      completed_at: now
    }
  end

  @doc "Aborts the agent"
  def abort(state) do
    now = NaiveDateTime.utc_now()

    %__MODULE__.T{
      agent: state.agent,
      status: :aborted,
      task: state.task,
      tools: state.tools,
      elapsed_ms: state.elapsed_ms,
      output: state.output <> " [ABORTED]",
      turn: state.turn,
      max_turns: state.max_turns,
      started_at: state.started_at,
      completed_at: now
    }
  end

  @doc "Gets state fields"
  def agent(state) do
    state.agent
  end

  def status(state) do
    state.status
  end

  def task(state) do
    state.task
  end

  def tools(state) do
    state.tools
  end

  def elapsed_ms(state) do
    state.elapsed_ms
  end

  def output(state) do
    state.output
  end

  def turn(state) do
    state.turn
  end

  def max_turns(state) do
    state.max_turns
  end
end

defmodule Case do
  @moduledoc "Case struct for agent state"

  defstruct [:agent, :status, :task, :tools, :elapsed_ms, :output,
             :turn, :max_turns, :started_at, :completed_at]
end