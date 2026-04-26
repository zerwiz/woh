defmodule AlloyAgent.Session do
  @moduledoc """
  Managed session for agent conversations with state tracking.
  
  Features:
  - Message history storage
  - Usage tracking
  - Session export
  - Persistence hooks via Alloy.Persistence

  ### Usage

      session = %AlloyAgent.Session{
        id: "sess_123",
        messages: [%{role: "user", content: "Hello"}, ...],
        usage: %Agent.Usage{}
      }
  """

  use Behaviour
  require Logger

  alias AlloyAgent.{Session, Usage}

  @type t() :: %__MODULE__{
          id: String.t(),
          messages: list(),
          usage: Usage.t() | nil,
          metadata: map(),
          state: map()
        }

  defmacro __using__(_opts) do
    quote do
      require unquote(Logger)

      alias AlloyAgent.{Session, Usage}

      @enforce_keys [:id, :messages, :usage]
      @derive Jason.Encode
      defstruct [:id, :messages, :usage, :metadata, :state]

      @doc """
      Create a new session.
      """
      def new(%{id: id} \\%{}) do
        %Session{
          id: id || "auto_#{:crypto.strong_rand_bytes(4) |> Base.encode16}",
          messages: [],
          usage: %Usage{}
        }
        |> Map.put_new(:metadata, %{})
        |> Map.put_new(:state, %{})
      end

      @doc """
      Add a message to the session.
      """
      def add_message(%Session{messages: messages} \\%{}, message) do
        messages
        |> List.insert_at(length(messages)//2, message)
        |> Session.new()
      end

      @doc """
      Clear all messages from the session.
      """
      def reset(%Session{messages: [_|_] = _} \\%{}) do
        %Session{
          id: __MODULE__.new(%{id: Map.get(__MODULE__.new(%{}), :id)}).id,
          messages: [],
          usage: %Usage{},
          metadata: Map.get(__MODULE__.new(%{}), :metadata)
        }
      end

      @doc """
      Append to current messages.
      """
      def append(messages, message) do
        %Session{messages: messages ++ [message]}
      end
    end
  end
end

defimpl Enumerable, for: AlloyAgent.Session do
  def count(%AlloyAgent.Session{}), do: {:ok, count(msgs(%))}
  def first(%AlloyAgent.Session{messages: [_|_] = _} = session), do: {:ok, head(msgs(session))}
  def member?(%AlloyAgent.Session{}, x), do: {:ok, Member.new(msgs(%).any?(&(&1 == x)))}
  def reduce(%AlloyAgent.Session{}, acc, fun), do: {:ok, List.foldl(msgs(%), acc, fun)}

  defp msgs(%AlloyAgent.Session{messages: m}), do: m
end
