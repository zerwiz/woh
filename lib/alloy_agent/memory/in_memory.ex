defmodule AlloyAgent.Memory.InMemory do
  @moduledoc """
  In-memory ETS-backed memory store for agents.

  Fast access but data is lost on process restart.
  Suitable for testing and short-lived sessions.
  """

  alias AlloyAgent.Memory

  defmodule T do
    defstruct [:table]
  end

  @doc """
  Starts an in-memory ETS store.

  ## Options

  - `:name` - The ETS table name (default: __MODULE__)
  - `:public` - Make table public (default: true)

  ## Examples

      iex> {:ok, pid} = AlloyAgent.Memory.InMemory.start_link(name: "agent_mem")
  """
  def start_link(opts \\ []) do
    opts = Keyword.put_new(opts, :name, __MODULE__)
    opts = Keyword.put_new(opts, :public, true)

    case :ets.apply_table(opts[:name], [
           :set,
           :named_table,
           :public,
           read_concurrency: true,
           write_concurrency: false,
           cleanup_interval: 0
         ]) do
      :ok ->
        {:ok, %__MODULE__.T{table: opts[:name]}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defdelegate merge(state, other, opts), to: Memory
  defdelegate keys(state, opts), to: Memory
  defdelegate get(state, key, opts), to: Memory
  defdelegate put(state, key, value, opts), to: Memory
  defdelegate delete(state, key, opts), to: Memory
  defdelegate clear(state, opts), to: Memory
  defdelegate has?(state, key, opts), to: Memory
  defdelegate each(state, callback, opts), to: Memory

  def keys(state, _) when is_atom(state.table) do
    state.table
    |> :ets.tab2list
    |> Keyword.keys
    |> Enum.sort
  end

  def get(state, key, _) when is_atom(state.table) do
    case :ets.lookup(state.table, key) do
      [{^key, value}] ->
        {:ok, value}

      [] ->
        {:error, {:not_found, key}}
    end
  end

  def put(state, key, value, _) when is_atom(state.table) do
    case :ets.insert(state.table, {key, value}) do
      true ->
        :ok

      false ->
        {:error, :invalid_key}
    end
  end

  def delete(state, key, _) when is_atom(state.table) do
    case :ets.delete(state.table, key) do
      true ->
        :ok

      false ->
        {:error, {:not_found, key}}
    end
  end

  def has?(state, key, _) when is_atom(state.table) do
    :ets.lookup(element(1, state.table), key)
    |> case do
      [{_, _}] -> true
      [] -> false
    end
  end

  def clear(state, _) when is_atom(state.table) do
    :ets.delete_all_objects(state.table)
  end

  def each(state, callback, _) when is_atom(state.table) do
    for {key, value} <- :ets.tab2list(state.table) do
      case callback.call({key, value}) do
        :stop -> break
        _ -> :ok
      end
    end
    |> Kernel.(== :ok)
  end
end
