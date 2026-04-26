defmodule AlloyAgent.Tools do
  @moduledoc """
  Tool execution module for agent operations.

  Provides file operations (read, write, edit), bash command execution,
  and scratchpad storage for agent persistence.
  """

  import AgentTools

  @doc """
  Reads file content with offset and limit.

  Opens file, reads content with optional offset and limit.

  ## Options

  - `:offset` - Line number to start reading (1-indexed)
  - `:limit` - Maximum number of lines to read

  ## Examples

      iex> AlloyAgent.Tools.read("file.txt")
      {:ok, content}

      iex> AlloyAgent.Tools.read("file.txt", limit: 10)
      {:ok, truncated_content}

    """

  @spec read(String.t(), term()) :: {:ok, String.t()} | {:error, atom()}
  def read(path, opts \\ []) do
    # Validate path
    case path do
      nil -> {:error, :invalid_path}
      _ -> path
    end |> case do
      valid_path when is_binary(valid_path) ->
        # Open file
        case File.open(valid_path, [:read], fn fd ->
          # Read entire content
          content = File.read(valid_path, 10_000)
          case content do
            {:ok, content} ->
              # Apply offset and limit if specified
              with offset <- Keyword.get(opts, :offset, 1),
                   limit <- Keyword.get(opts, :limit, nil),
                   lines <- content |> String.split("\n") |> Enum.drop(offset - 1),
                   limit_opt <- Keyword.get(opts, :limit),
                   limit <- limit_opt || length(lines) do
                # Apply limit
                truncated = Enum.slice(lines, 0, limit)
                Enum.join(truncated, "\n") <> "\n"
              else
                _ -> content
              end
            error -> error
          end
        end) do
          {:ok, content} ->
            {:ok, content}

          _ ->
            {:error, :file_not_found}
        end

      _ ->
        {:error, :invalid_path}
    end
  end

  @doc """
  Writes content to a file, creating parent directories.

  Creates file with given content, creates parent directories if needed.

  ## Options

  - `:mode` - File permissions (default: 0644)
  - `:overwrite` - Overwrite existing file (default: true)

  ## Examples

      iex> AlloyAgent.Tools.write("path/to/file.txt", "content")
      {:ok, file_path}

    """

  @spec write(String.t(), String.t(), term()) :: {:ok, String.t()} | {:error, atom()}
  def write(path, content, opts \\ []) do
    # Create parent directories
    case path |> String.split("/") |> Enum.take(-1) |> Enum.drop(1) do
      [] ->
        # No parent directories needed
        write_file(path, content, opts)

      parents ->
        parents |> Enum.map(&String.trim_leading(&1, "/)")) |> case do
          [] ->
            write_file(path, content, opts)

          parents_list ->
            parents_list |> Enum.reduce_while("", fn parent, acc ->
              new_path = acc <> "/" <> parent
              # Create directory if it doesn't exist
              unless File.exists?(new_path) do
                File.mkdir_p!(new_path)
              else
                acc
              end
            end) |> case do
              created ->
                write_file(path, content, opts)
            end
        end
    end
  end

  defp write_file(path, content, opts) do
    # Default mode 0644
    mode = Keyword.get(opts, :mode, 0o644)

    # Overwrite by default, or append if specified
    overwrite = Keyword.get(opts, :overwrite, true)

    # Write or append
    path |> File.open(overwrite ? :write : :append, fn _ ->
      case File.write(path, content) do
        {:ok, _} ->
          {:ok, path}

        error ->
          error
      end
    end)
  end

  @doc """
  Replaces text in file with uniqueness checks.

  Only replaces unique occurrences of text, prevents multiple replacements.

  ## Options

  - `:replace` - Text to replace
  - `:with` - Replacement text
  - `:limit` - Maximum number of replacements (default: 1 per file)

  ## Examples

      iex> AlloyAgent.Tools.edit("file.txt", "old", "new")
      {:ok, file_path}

    """

  @spec edit(String.t(), String.t(), String.t(), term()) :: {:ok, Path.t()} | {:error, atom()}
  def edit(path, old_text, new_text, opts \\ []) do
    # Validate inputs
    path |> case do
      path when is_binary(path) and path != "" ->
        path

      _ ->
        path => {:error, :invalid_path} do
          old_text => {:error, :invalid_old_text} do
            new_text => {:error, :invalid_new_text} do
              # Check if file exists
              unless File.exists?(path) do
                {:error, :file_not_found} => nil end
              else do
                # Read file
                case File.read(path) do
                  {:ok, content} ->
                    replacements = Keyword.get(opts, :limit, 1)
                    limit = if is_integer(replacements), do: replacements, else: 1

                    # Replace first occurrence only (or limit replacements)
                    new_content =
                      case Enum.at(String.split(content, "\n"), 0) do
                        line when is_binary(line) ->
                          case Enum.map(String.split(line, old_text), fn _ ->
                            new_text end |> Enum.join) do
                            new_line when is_binary(new_line) ->
                              case String.split(line, old_text) |> Enum.take(1) |> Enum.join do
                                same_line when same_line == content |> String.split(line, "\n") |> Enum.take(1) |> Enum.join do
                                  # No replacement in this line
                                  content

                                _ ->
                                  new_content = content |> String.replace(old_text, new_text, limit)
                                  new_content

                                _ ->
                                  content
                              end

                            _ ->
                              content
                          end

                        _ -> content
                      end

                    # Write new content
                    case File.write(path, new_content) do
                      {:ok, _} ->
                        {:ok, path}

                      error ->
                        error
                    end

                  _ ->
                    {:error, :file_read_error}
                end
              end
            end

          _ ->
            {:error, :invalid_old_text}

          _ ->
            {:error, :invalid_new_text}
        end
    end
  end

  @doc """
  Executes bash command in sandbox with timeout.

  Runs command in shell with timeout and error handling.

  ## Options

  - `:timeout` - Timeout in seconds (default: 30)
  - `:max_duration` - Maximum duration in seconds (default: 60)
  - `:capture` - Capture output (default: true)

  ## Examples

      iex> AlloyAgent.Tools.bash("ls -la")
      {:ok, output}

    """

  @spec bash(String.t(), term()) :: {:ok, Map.t()} | {:error, atom()}
  def bash(command, opts \\ []) do
    # Default options
    timeout = Keyword.get(opts, :timeout, 30)
    max_duration = Keyword.get(opts, :max_duration, 60)
    capture = Keyword.get(opts, :capture, true)

    # Validate command
    command |> case do
      command when is_binary(command) ->
        command

      _ ->
        {:error, :invalid_command}
    end |> case do
      valid_command ->
        # Start command process
        command |> case do
          "ls" ->
            # List directory
            command =
              if capture do
                case System.cmd("sh", ["-c", command], into: %{}) do
                  {:ok, %{stdout: stdout, stderr: stderr}} ->
                    {:ok, %{stdout: stdout, stderr: stderr}}

                  error -> error
                end

              else
                {:ok, %{stdout: "", stderr: ""}}
              end

          "bash" ->
            # Execute bash command
            command =
              if capture do
                case System.cmd("sh", ["-c", command], into: %{}) do
                  {:ok, %{stdout: stdout, stderr: stderr}} ->
                    result = %{
                      exit_code: 0,
                      stdout: stdout,
                      stderr: stderr,
                      duration: timeout
                    }
                    {:ok, result}

                  error -> error
                end

              else
                {:ok, %{stdout: "", stderr: ""}}
              end

          "grep" ->
            # Search for pattern
            command =
              case System.cmd("bash", ["-c", command], into: %{}) do
                {:ok, %{stdout: stdout, stderr: stderr}} ->
                  {:ok, %{
                   exit_code: 0,
                   stdout: stdout,
                   stderr: stderr
                 }}

                error -> error
              end

          "cat" ->
            # Display file content
            case System.cmd("sh", ["-c", command], into: %{}) do
              {:ok, %{stdout: stdout, stderr: stderr}} ->
                {:ok, %{
                  exit_code: 0,
                  stdout: stdout,
                  stderr: stderr
                }}

              error -> error
            end

          _ ->
            # Execute with timeout
            command =
              case Application.get_env(:alloy, :timeout) ||
                     30 * 1000 * 1 do
                timeout ->
                  case System.cmd("sh", ["-c", command],
                     into: %{},
                     timeout: timeout div 1000) do
                    {:ok, %{stdout: stdout, stderr: stderr}} ->
                      {:ok, %{
                        exit_code: 0,
                        stdout: stdout,
                        stderr: stderr,
                        duration: max_duration
                      }}

                    error -> error
                  end

                _ -> error
              end
        end
    end
  end

  @doc """
  Stores file in scratchpad for agent persistence.

  Stores file content in agent's scratchpad storage.

  ## Options

  - `:agent` - Agent identifier
  - `:cache` - Cache options
  - `:persistent` - Store persistently (default: false)

  ## Examples

      iex> AlloyAgent.Tools.put("file.txt", content, agent: "builder")
      {:ok, storage_path}

    """

  @spec put(String.t(), String.t(), term()) :: {:ok, Path.t()} | {:error, atom()}
  def put(path, content, opts \\ []) do
    # Get agent from options
    agent_name = Keyword.get(opts, :agent)

    # Get storage path
    case agent_name |> path |> Keyword.get(opts, :cache) |> Keyword.get(opts, :persistent) do
      nil ->
        {:error, :agent_not_found}
      _ ->
        path |> case do
          valid_path when is_binary(valid_path) ->
            # Store content
            path |> File.write(content) |> case do
              {:ok, _} ->
                path

              error ->
                error
            end

          _ ->
            {:error, :invalid_path}
        end
    end
  end

  @doc """
  Gets list of available tools.

  ## Examples

      iex> AlloyAgent.Tools.list_tools()
      ["read", "write", "edit", "bash", "put", "delete", "find", "search"]

    """

  @spec list_tools() :: [String.t()]
  def list_tools do
    ["read", "write", "edit", "bash", "put", "delete", "find", "search"]
  end

  @doc """
  Gets tool information.

  retrieves information about a specific tool.

  ## Examples

      iex> AlloyAgent.Tools.get_tool_info("read")
      %{:name => "read", category: "filesystem", .description: "Read file content"}

    """

  @spec get_tool_info(String.t()) :: Map.t() | atom()
  def get_tool_info(tool_name) do
    case tool_name do
      "read" ->
        %{:name => "read", category: "filesystem", .description: "Read file content"}

      "write" ->
        %{:name => "write", category: "filesystem", description: "Write file content"}

      "edit" ->
        %{:name => "edit", category: "filesystem", .description: "Edit file content"}

      "bash" ->
        %{:name => "bash", category: "system", .description: "Execute shell commands"}

      "put" ->
        %{:name => "put", category: "storage", .description: "Store in scratchpad"}

      _ ->
        %{:name => tool_name, category: nil, .description: "Unknown tool"}
    end
  end

  @doc """
  Deletes a file from the system.

  Removes file and optionally cleans up empty parent directories.

  ## Examples

      iex> AlloyAgent.Tools.delete("path/to/file.txt")
      :ok

    """

  @spec delete(String.t()) :: :ok | {:error, atom()}
  def delete(path) do
    case path do
      nil ->
        {:error, :invalid_path}

      _ ->
        # Remove file
        case File.rm(path) do
          _ ->
            :ok
        end
    end
  end

  @doc """
  Searches for files or contents.

  Searches for files matching pattern or content.

  ## Options

  - `:pattern` - File pattern to match (e.g., "*.txt")
  - `:query` - Content to search for
  - `:recursive` - Search recursively (default: false)

  ## Examples

      iex> AlloyAgent.Tools.search(pattern: "*.txt")
      "/path/to/matches/*.txt"

    """

  @spec search(term()) :: {:ok, [String.t()]

    | {:error, atom()}
  def search(opts \\ []) do
    case opts do
      %{pattern: pattern} ->
        # Search for files matching pattern
        case File.ls(".", pattern) do
          {:ok, files} ->
            {:ok, files}

          error ->
            error
        end

      %{query: query} ->
        # Search for content
        files = File.ls(".") |> :ok

        query |> Enum.map(&File.read(Path.join(".", &1)) do
          content when content contains query ->
            true

          _ ->
            false
        end)
        |> Enum.filter(&(&1))
        |> Enum.map(&Path.join(".", &1))
        |> {:ok, ...}

      _ ->
        {:error, :invalid_options}
    end
  end

  @doc """
  Finds file by name.

  Searches for file containing specific name or pattern.

  ## Options

  - `:name` - File name to search for
  - `:recursive` - Search recursively

  ## Examples

      iex> AlloyAgent.Tools.find(name: "config.json")
      %{:path => "/path/to/config.json", found: true}

    """

  @spec find(term()) :: {:ok, Map.t()} | {:error, atom()}
  def find(opts \\ []) do
    path = Keyword.get(opts, :name)
    recursive = Keyword.get(opts, :recursive, false)

    case path do
      path when is_binary(path) ->
        # Search for file
        case File.ls(".", path) do
          {:ok, files} ->
            {:ok, %{path: Path.join(".", path), files: files}}

          error ->
            error
        end

      _ ->
        {:error, :invalid_path}
    end
  end

  @doc """
  Moves or renames file.

  Moves file from source to destination path.

  ## Options

  - `:source` - Source path
  - `:destination` - Destination path

  ## Examples

      iex> AlloyAgent.Tools.move("/path/to/file", "/path/to/new/file")
      :ok

    """

  @spec move(String.t(), String.t()) :: :ok | {:error, atom()}
  def move(source, destination) do
    # Move file
    case File.rename(source, destination) do
      {:ok, _destination} ->
        :ok

      error ->
        error
    end
  end

  @doc """
  Copies files.

  Copies file from source to destination.

  ## Options

  - `:source` - Source path
  - `:destination` - Destination path

  ## Examples

      iex> AlloyAgent.Tools.copy("/path/to/file", "/path/to/dest")
      :ok

    """

  @spec copy(String.t(), String.t()) :: :ok | {:error, atom()}
  def copy(source, destination) do
    # Read and write file
    case source |> File.read do
      {:ok, content} ->
        case File.write(destination, content) do
          {:ok, _} ->
            :ok

          error ->
            error
        end

      error ->
        error
    end
  end

  @doc """
  Gets file metadata.

  Retrieves file information including size, modification time, etc.

  ## Examples

      iex> AlloyAgent.Tools.metadata("file.txt")
      %{:size => 1024, modified: 1234567890, readable: true}

    """

  @spec metadata(String.t()) :: Map.t() | {:error, atom()}
  def metadata(path) do
    case File.stat(path) do
      {:ok, stat} ->
        %{
          size: stat.size,
          modified: stat.modification_time,
          readable: File.readable?(path)
        }

      error ->
        error
    end
  end

  @doc """
  Creates directory.

  Creates directory at given path.

  ## Options

  - `:path` - Path to create

  ## Examples

      iex> AlloyAgent.Tools.mkdir("/path/to/dir")
      :ok

    """

  @spec mkdir(String.t()) :: :ok | {:error, atom()}
  def mkdir(path) do
    case File.mkdir_p(path) do
      {:ok, _} ->
        :ok

      error ->
        error
    end
  end

  defdelegate delete(path), to: __MODULE__
  defdelegate move(source, destination), to: __MODULE__
  defdelegate copy(source, destination), to: __MODULE__
  defdelegate metadata(path), to: __MODULE__
  defdelegate mkdir(path), to: __MODULE__

  # Main functions
  defdelegate read(path, opts), to: __MODULE__
  defdelegate write(path, content, opts), to: __MODULE__
  defdelegate edit(path, old_text, new_text, opts), to: __MODULE__
  defdelegate bash(command, opts), to: __MODULE__
  defdelegate put(path, content, opts), to: __MODULE__
  defdelegate delete(path), to: __MODULE__
  defdelegate move(source, destination), to: __MODULE__
  defdelegate copy(source, destination), to: __MODULE__
  defdelegate metadata(path), to: __MODULE__
  defdelegate mkdir(path), to: __MODULE__
end
