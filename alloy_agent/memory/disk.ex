defmodule AlloyAgent.Memory.Disk do
  @moduledoc """
  Disk-backed memory store for persistent agent data.

  Uses EExEFS for atomic file operations and directory-based storage.
  Suitable for long-running sessions and recovery scenarios.
  """

  alias AlloyAgent.Memory

  alias Alloy.Filesystem, as: FS

  defmodule T do
    defstruct [:path]
  end

  @doc """
  Creates a new disk-backed memory store.

  ## Options

  - `:path` - Base directory for storing agent data
  - `:atomic` - Use atomic file operations (default: true)
  - `:versioning` - Enable versioned backups (default: false)

  ## Examples

      iex> AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      {:ok, %AlloyAgent.Memory.Disk{path: "/tmp/agents"}}

  """
  def new(opts \\ []) do
    path = Keyword.fetch!(opts, :path)

    # Create directory if it doesn't exist
    unless File.dir?(path) do
      FS.mkdir(path, recursive: true)
    end

    %__MODULE__.T{path: path}
  end

  defdelegate merge(state, other, opts), to: Disk
  defdelegate keys(state, opts), to: Disk
  defdelegate get(state, key, opts), to: Disk
  defdelegate put(state, key, value, opts), to: Disk
  defdelegate delete(state, key, opts), to: Disk
  defdelegate clear(state, opts), to: Disk
  defdelegate has?(state, path, opts), to: Disk
  defdelegate each(state, callback, opts), to: Disk
  defdelegate exists?(state, path, opts), to: Disk
  defdelegate read(state, path, opts), to: Disk
  defdelegate write(state, path, data, opts), to: Disk

  @doc """
  Gets a value from disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.put(mem, "agent-1", %{status: :idle})
      iex> Alloy.Disk.get(mem, "agent-1")
      {:ok, %{status: :idle}}

  """
  def get(%__MODULE__.T{path: base}, key, _opts) do
    path = File.join(base, String.replace_prefix(key, ".", ""))

    unless File.exists?(path) do
      return {:error, {:file_not_found, key}}
    end

    case read(%__MODULE__.T{path: base}, path) do
      {:ok, data} ->
        {:ok, data}

      error ->
        error
    end
  end

  def get(%__MODULE__.T{path: base}, file_path, opts \\ []) do
    path = File.join(base, String.trim_leading(file_path, "/"))

    unless File.exists?(path) do
      return {:error, {:file_not_found, path}}
    end

    case read(%__MODULE__.T{path: base}, path, opts) do
      {:ok, data} ->
        {:ok, data}

      error ->
        error
    end
  end

  @doc """
  Puts a value into disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.put(mem, "agent-1", %{status: :idle})
      :ok

  """
  def put(%__MODULE__.T{path: base}, key, value, opts \\ []) do
    path = File.join(base, String.replace_prefix(key, ".", ""))

    unless File.mkdir_p(path, recursive: true) do
      return {:error, :permission_denied}
    end

    unless File.exists?(path) do
      File.write(path, "")
    end

    try do
      case read(%__MODULE__.T{path: base}, path, opts) do
        {:ok, existing_data} ->
          # Merge data if it exists
          new_value = Map.merge(existing_data, value)
          write(%__MODULE__.T{path: base}, path, new_value)
          :ok

        error ->
          # First write
          write(%__MODULE__.T{path: base}, path, value)
          :ok
      end
    rescue
      e ->
        {:error, {:write_error, e}}
    end
  end

  def put(%__MODULE__.T{path: base}, file_path, data, opts \\ []) do
    path = File.join(base, String.trim_leading(file_path, "/"))

    unless File.mkdir_p(path, recursive: true) do
      return {:error, :permission_denied}
    end

    case write(%__MODULE__.T{path: base}, path, data, opts) do
      :ok ->
        :ok

      error ->
        error
    end
  end

  @doc """
  Deletes a file from disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.delete(mem, "agent-1")
      :ok

  """
  def delete(%__MODULE__.T{path: base}, key, _opts) do
    path = File.join(base, String.replace_prefix(key, ".", ""))

    unless File.exists?(path) do
      return {:error, {:file_not_found, key}}
    end

    try do
      File.rm(path)
    rescue
      e ->
        {:error, {:delete_error, e}}
    end
  end

  def delete(%__MODULE__.T{path: base}, file_path, _opts) do
    path = File.join(base, String.trim_leading(file_path, "/"))

    unless File.exists?(path) do
      return {:error, {:file_not_found, path}}
    end

    try do
      File.rm(path)
    rescue
      e ->
        {:error, {:delete_error, e}}
    end
  end

  @doc """
  Checks if a file exists in disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.has?(mem, "agent-1")
      true

  """
  def has?(%__MODULE__.T{path: base}, key, _opts) do
    path = File.join(base, String.replace_prefix(key, ".", ""))
    File.exists?(path)
  end

  def has?(%__MODULE__.T{path: base}, file_path, _opts) do
    path = File.join(base, file_path)
    File.exists?(path)
  end

  @doc """
  Gets all keys from disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.put(mem, "agent-1", %{status: :idle})
      iex> Alloy.Disk.put(mem, "agent-2", %{status: :running})
      iex> Alloy.Disk.keys(mem)
      []

  """
  def keys(%__MODULE__.T{path: base}, _opts) do
    base_path = Path.dirname(base)
    pattern = "#{base_path}/*"

    FS.ls(pattern)
    |> Enum.map(fn dir ->
      String.replace_prefix(dir, "#{Path.dirname(base)}/", "")
    end)
    |> Enum.sort
  end

  @doc """
  Iterates over all items in disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.each(mem, {1, fn {k, v} -> IO.inspect({k, v}) end})
      :ok

  """
  def each(%__MODULE__.T{path: base}, callback, opts \\ []) do
    case keys(%__MODULE__.T{path: base}, opts) do
      [] ->
        :ok

      keys ->
        for key <- keys do
          case read(%__MODULE__.T{path: base}, key, opts) do
            {:ok, value} ->
              case callback.call({key, value}) do
                :stop -> :stop
                _ -> :continue
              end

            error ->
              :continue
          end
        end
        |> Kernel.==(== :ok)
    end
  end

  @doc """
  Reads a file from disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.read(mem, "agent-1")
      {:ok, %{status: :idle}}

  """
  def read(%__MODULE__.T{path: base}, key, opts \\ []) do
    path = File.join(base, String.replace_prefix(key, "."))

    if File.exists?(path) do
      content = File.read(path)

      case content do
        {:ok, binary} ->
          File.read(path, unicode: true)
          |> case do
            {:ok, text} when is_binary(text) ->
              {:ok, Jason.decode!(text)}

            error ->
              error
          end

        error ->
          error
      end
    else
      {:error, {:file_not_found, path}}
    end
  end

  def read(%__MODULE__.T{path: base}, file_path, opts \\ []) do
    path = File.join(base, file_path)

    if File.exists?(file_path) do
      File.read(file_path, unicode: true)
      |> case do
        {:ok, text} when is_binary(text) ->
          {:ok, Jason.decode!(text)}

        error ->
          error
      end
    else
      {:error, {:file_not_found, path}}
    end
  end

  @doc """
  Writes data to disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.write(mem, "agent-1", %{status: :idle})
      :ok

  """
  def write(%__MODULE__.T{path: base}, path, data, opts \\ []) do
    unless File.dir?(path) do
      path = File.join(base, path)
    end

    content = Jason.encode!(data)

    case File.write(path, content, mode: :write) do
      :ok ->
        :ok

      error ->
        error
    end
  end

  @doc """
  Clears all data from disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.clear(mem)
      :ok

  """
  def clear(%__MODULE__.T{path: base}, _opts) do
    try do
      # Remove all keys in base directory
      File.ls(base)
      |> case do
        [] ->
          :ok

        keys ->
          keys
          |> Enum.each(&File.rm/1)
      end

      # Remove the base directory itself
      File.rm_rf(base)
    rescue
      e ->
        {:error, e}
    end
  end

  @doc """
  Checks if a file exists in disk storage.

  ## Examples

      iex> %Disk{path: "/tmp/agents"} = AlloyAgent.Memory.Disk.new(path: "/tmp/agents")
      iex> Alloy.Disk.exists?(mem, "agent-1")
      false

  """
  def exists?(%__MODULE__.T{path: base}, file_path, _opts) do
    path = File.join(base, String.trim_leading(file_path, "/"))
    File.exists?(path)
  end
end
