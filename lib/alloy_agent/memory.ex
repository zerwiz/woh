defmodule AlloyAgent.Memory do
  @moduledoc """
  Memory module for managing agent memory stores.

  Supports both in-memory (ETS) and disk-backed memory options.
  Implements Alloy.Memory behaviour for standard memory operations.
  """

  alias AlloyAgent.Memory.InMemory
  alias AlloyAgent.Memory.Disk

  @type t :: InMemory.t() | Disk.t()

  @doc """
  Returns a new memory store (in-memory by default).

  ## Examples

      iex> AlloyAgent.Memory.new(:memory)
      {:ok, %InMemory{}}

      iex> AlloyAgent.Memory.new(:disk, "/tmp/agents/memory")
      {:ok, %Disk{}}

  """
  def new(type, opts \\ []) when type in [:memory, :disk] do
    case type do
      :memory -> InMemory.start_link(opts)
      :disk -> Disk.new(opts)
    end
  end

  @doc """
  Creates an in-memory ETS store for testing.

  ## Examples

      iex> AlloyAgent.Memory.start_link()
      {:ok, pid}

  """
  def start_link(opts \\ []) do
    InMemory.start_link(opts)
  end

  @doc """
  Creates a disk-backed memory store.

  ## Examples

      iex> AlloyAgent.Memory.disk_new("/tmp/agents/memory")
      {:ok, %Disk{path: "/tmp/agents/memory"}}

  """
  def disk_new(path) do
    Disk.new(path: path)
  end

  @doc """
  Stores data in the memory.

  ## Keys

  - `agent_id`: The agent identifier
  - `data`: The data to store (map or struct)

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      :ok

  """
  def put(memory, key, data, opts \\ []) do
    memory
    |> put(key, data, opts)
  end

  @doc """
  Retrieves data from memory.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.get(mem, "agent-1")
      {:ok, %{status: :idle}}

  """
  def get(memory, key, opts \\ []) do
    memory
    |> get(key, opts)
  end

  @doc """
  Removes data from memory.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.delete(mem, "agent-1")
      :ok

  """
  def delete(memory, key, opts \\ []) do
    memory
    |> delete(key, opts)
  end

  @doc """
  Clears all data from memory.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.clear(mem)
      :ok

  """
  def clear(memory, opts \\ []) do
    memory
    |> clear(opts)
  end

  @doc """
  Checks if memory has data for a key.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.has?(mem, "agent-1")
      false

      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.has?(mem, "agent-1")
      true

  """
  def has?(memory, key, opts \\ []) do
    memory
    |> has?(key, opts)
  end

  @doc """
  Returns all keys in memory.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.put(mem, "agent-2", %{status: :running})
      iex> AlloyAgent.Memory.keys(mem)
      ["agent-1", "agent-2"]

  """
  def keys(memory, opts \\ []) do
    memory
    |> keys(opts)
  end

  @doc """
  Iterates over all items in memory.

  ## Examples

      iex> {:ok, mem} = AlloyAgent.Memory.new(:memory)
      iex> AlloyAgent.Memory.put(mem, "agent-1", %{status: :idle})
      iex> AlloyAgent.Memory.each(mem, {1, fn {k, v} -> IO.inspect({k, v}) end})
      :ok

  """
  def each(memory, callback, opts \\ []) do
    memory
    |> each(callback, opts)
  end

  alias Alloy.Memory
  @doc """
  Implements Alloy.Memory behaviour callbacks.
  """

  defdelegate merge(memory, memory, opts), to: Alloy.Memory
  defdelegate keys(memory, opts), to: Alloy.Memory
  defdelegate get(memory, key, opts), to: Alloy.Memory
  defdelegate put(memory, key, value, opts), to: Alloy.Memory
  defdelegate delete(memory, key, opts), to: Alloy.Memory
  defdelegate clear(memory, opts), to: Alloy.Memory
  defdelegate has?(memory, key, opts), to: Alloy.Memory
  defdelegate each(memory, callback, opts), to: Alloy.Memory
end
