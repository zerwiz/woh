defmodule AlloyAgent.Session do
  @moduledoc """
  Session module for agent session management.

  Tracks session state, output, and turn coordination.
  """

  @typedoc "Session state"
  defstruct [
    :agent,     # Agent identifier
    :status,    # Session status (:idle, :running, :completed, :error)
    :task,      # Current task
    :tools,     # Tool usage counters
    :elapsed_ms, # Elapsed time
    :output,    # Session output
    :turn,      # Current turn count
    :max_turns, # Maximum turns (nil for unlimited)
    :started_at, # Session start time
    :completed_at # Session completion time
  ]

  @doc "Creates a new session"
  def new(opts \\ []) do
    %__MODULE__{
      agent: Keyword.get(opts, :agent, "unknown"),
      status: :idle,
      task: Keyword.get(opts, :task, nil),
      tools: :default,
      elapsed_ms: 0,
      output: "",
      turn: 0,
      max_turns: Keyword.get(opts, :max_turns, nil),
      started_at: NaiveDateTime.utc_now(),
      completed_at: nil
    }
  end

  @doc "Gets session output"
  def output(session) do
    session.output
  end

  @doc "Gets session status"
  def status(session) do
    session.status
  end

  @doc "Gets session task"
  def task(session) do
    session.task
  end

  @doc "Sets session output and advances turn"
  def append_output(session, output) do
    %__MODULE__{
      agent: session.agent,
      status: session.status,
      task: session.task,
      tools: session.tools,
      elapsed_ms: session.elapsed_ms,
      output: session.output <> output,
      turn: session.turn,
      max_turns: session.max_turns,
      started_at: session.started_at,
      completed_at: session.completed_at
    }
  end

  @doc "Increments turn counter"
  def advance_turn(session) do
    %__MODULE__{
      agent: session.agent,
      status: session.status,
      task: session.task,
      tools: session.tools,
      elapsed_ms: session.elapsed_ms,
      output: session.output,
      turn: session.turn + 1,
      max_turns: session.max_turns,
      started_at: session.started_at,
      completed_at: session.completed_at
    }
  end

  @doc "Records tool usage"
  def record_tool_usage(session, tool_name) do
    case session.tools do
      {} ->
        %__MODULE__{
          session
          | tools: %{tool_name => 0}
        }
      %{^tool_name => count} ->
        %__MODULE__{
          session
          | tools: Map.update(session.tools, tool_name, count, &(&1 + 1))
        }
    end
  end

  @doc "Finishes the session"
  def finish(session, output) do
    now = NaiveDateTime.utc_now()
    %__MODULE__{
      agent: session.agent,
      status: :completed,
      task: session.task,
      tools: session.tools,
      elapsed_ms: session.elapsed_ms,
      output: session.output <> output,
      turn: session.turn,
      max_turns: session.max_turns,
      started_at: session.started_at,
      completed_at: now
    }
  end

  @doc "Errors the session"
  def error(session, error) do
    now = NaiveDateTime.utc_now()
    %__MODULE__{
      agent: session.agent,
      status: :error,
      task: session.task,
      tools: session.tools,
      elapsed_ms: session.elapsed_ms,
      output: session.output <> "\n[ERROR] #{inspect(error)}",
      turn: session.turn,
      max_turns: session.max_turns,
      started_at: session.started_at,
      completed_at: now
    }
  end

  @doc "Aborts the session"
  def abort(session) do
    now = NaiveDateTime.utc_now()
    %__MODULE__{
      agent: session.agent,
      status: :aborted,
      task: session.task,
      tools: session.tools,
      elapsed_ms: session.elapsed_ms,
      output: session.output <> " [ABORTED]",
      turn: session.turn,
      max_turns: session.max_turns,
      started_at: session.started_at,
      completed_at: now
    }
  end

  defp default_tools do
    %{
      "read" => 0,
      "write" => 0,
      "find" => 0,
      "grep" => 0,
      "ls" => 0,
      "edit" => 0,
      "bash" => 0
    }
  end
end