defmodule AlloyAgent.Memory do
  @moduledoc """
  Memory module for agent data storage.

  Provides GenServer-based in-memory storage for agent sessions and state.
  Uses ETs tables under the hood for high-performance key-value storage.
  """

  use GenServer

  @doc "Starts memory server"
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, opts ++ [name: :memory_server])
  end

  @doc "Gets memory for agent"
  def get(key) do
    GenServer.call(__MODULE__, {:get, key})
  end

  @doc "Puts memory for agent"
  def put(key, value) do
    GenServer.call(__MODULE__, {:put, key, value})
  end

  @doc "Deletes memory for agent"
  def delete(key) do
    GenServer.call(__MODULE__, {:delete, key})
  end

  @doc "Gets memory"
  def memory() do
    case GenServer.call(__MODULE__, :memory) do
      {:ok, value} ->
        value

      nil ->
        %{}
    end
  end

  @doc "Clears all memory"
  def clear() do
    GenServer.call(__MODULE__, :clear)
  end

  def init(_opts) do
    ets = :ets.new(:memory_store, [:set, :named_table, :public])
    {:ok, ets}
  end

  @impl true
  def handle_call({:get, key}, _from, ets) do
    case :ets.lookup(ets, key) do
      [{^key, value} | _] ->
        {:reply, {:ok, value}, ets}
      [] ->
        {:reply, :not_found, ets}
    end
  end

  @impl true
  def handle_call({:put, key, value}, _from, ets) do
    ets = :ets.insert(ets, {key, value})
    {:reply, :ok, ets}
  end

  @impl true
  def handle_call({:delete, key}, _from, ets) do
    ets = :ets.delete(ets, key)
    {:reply, :ok, ets}
  end

  @impl true
  def handle_call(:memory, _from, ets) do
    result = :ets.tab2array(ets)
    {:reply, {:ok, Dict.new(result)}, ets}
  end

  @impl true
  def handle_call(:clear, _from, ets) do
    ets = :ets.delete_all_objects(ets)
    {:reply, :ok, ets}
  end

  @impl true
  def handle_cast(_msg, state) do
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
end