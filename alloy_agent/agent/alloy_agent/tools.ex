defmodule AlloyAgent.Tools do
  @moduledoc """
  Built-in tools for the alloy_agents system:

  - read: Read file contents
  - write: Write to file (overwrites)
  - edit: Edit single file with replacements
  - bash: Execute shell commands (sandboxed)
  - scratchpad: Temporary storage (Erlang term storage)
  """

  alias Alloy.Agent.Events
  alias AlloyAgent.{Events, Tools, Tool}

  @doc """
  Read a file's contents.

  Supports:
  - Text files (all formats)
  - Images (jpg, png, gif, webp) as attachments
  - Binary data as Base64

  Options:
  - offset: Line number to start (1-indexed)
  - limit: Lines to read
  """
  def read(path, opts \\ []) do
    %{path: path_value, offset: offset, limit: limit} = opts
      |> Keyword.merge(%{path: path, offset: 1, limit: 51200})

    # Implementation stub
    Events.emit([:__MODULE__, :read, :success])
  end

  @doc """
  Write content to a file.

  Creates the file if it doesn't exist.
  Automatically creates parent directories.
  """
  def write(path, content) do
    # Implementation stub
    Events.emit([:__MODULE__, :write, :success])
  end

  @doc """
  Edit a single file using exact text replacement.
  
  Requirements:
  - Each edit[].oldText must match a unique, non-overlapping region
  - Changes affecting nearby lines should be merged into one edit
  """
  def edit(path, edits) do
    # Implementation stub
    Events.emit([:__MODULE__, :edit, :success])
  end

  @doc """
  Execute a shell command in a sandboxed environment.
  
  Sandboxing:
  - Runs in a separate process
  - No network access
  - No directory change
  - Timeout enforced

  Returns command output as text.
  """
  def bash(command, opts \\ []) do
    # Implementation stub
    Events.emit([:__MODULE__, :bash, :success])
  end

  @doc """
  Scratchpad - temporary Erlang term storage.

  Usage:
      put("key", value) - store a value
      get("key") - retrieve a value
      remove("key") - delete a value
  """

  alias AlloyAgent.Tools

  # In-memory storage (would be backed by file system in production)
  defp storage do
    @storage ||= %{}
  end

  def put(key, value) do
    @storage = Map.put(@storage, key, value)
    Events.emit([:__MODULE__, :scratchpad, :put])
  end

  def get(key) do
    Map.get(@storage, key)
  end

  def remove(key) do
    @storage = Map.delete(@storage, key)
    Events.emit([:__MODULE__, :scratchpad, :remove])
  end

  @doc """
  Tool type with metadata.

  ### Fields

        id :: atom() - e.g. :read, :write
        name :: String.t() - e.g. "read"
        description :: String.t()
        input_schema :: map() - JSON schema for the tool arguments
        output_schema :: map() - JSON schema for the tool output
        input_name :: String.t() - e.g. "arguments"
        output_name :: String.t() - e.g. "result"
        parameters :: map() - Tool-specific parameters (optional)
        version :: String.t() - Tool version
  """

  @type tool_spec :: %Tool{
          id: atom(),
          name: String.t(),
          description: String.t(),
          input_schema: map(),
          output_schema: map(),
          input_name: String.t(),
          output_name: String.t(),
          parameters: map(),
          version: String.t()
        }

  def read_spec, do:
    %Tool{
      id: :read,
      name: "read",
      description:
        "Read file contents. Supports text files, images as attachments, and binary data. Uses offset/limit for large files.",
      input_schema: %{
        type: "object",
        properties: %{
          path: %{
            type: "string",
            description: "Path to the file to read"
          },
          offset: %{
            type: ["integer", "null"],
            description: "Line number to start reading from (1-indexed)"
          },
          limit: %{
            type: ["integer", "null"],
            description: "Maximum number of lines to read"
          }
        },
        required: ["path"]
      },
      output_schema: %{
        type: "object",
        properties: %{
          content: %{
            type: "string",
            description: "File contents"
          },
          path: %{
            type: "string",
            description: "File path"
          }
        }
      },
      input_name: "arguments",
      output_name: "result",
      parameters: %{},
      version: "1.0"
    }

  def write_spec, do:
    %Tool{
      id: :write,
      name: "write",
      description:
        "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.",
      input_schema: %{
        type: "object",
        properties: %{
          path: %{
            type: "string",
            description: "Path to the file to write"
          },
          content: %{
            type: "string",
            description: "Content to write to the file"
          }
        },
        required: [:path, :content]
      },
      output_schema: %{
        type: "object",
        properties: %{
          content: %{
            type: "string",
            description: "Content written to file"
          },
          path: %{
            type: "string",
            description: "File path"
          }
        }
      },
      input_name: "arguments",
      output_name: "result",
      parameters: %{},
      version: "1.0"
    }

  def edit_spec, do:
    %Tool{
      id: :edit,
      name: "edit",
      description:
        "Edit a single file using exact text replacement. Each edit[].oldText must match a unique, non-overlapping region of the original file. If two changes affect the same block or nearby lines, merge them into one edit instead of emitting overlapping edits.",
      input_schema: %{
        type: "object",
        properties: %{
          path: %{
            type: "string",
            description: "Path to the file to edit (relative or absolute)"
          },
          edits: %{
            type: "array",
            items: %{
              additionalProperties: false,
              properties: %{
                oldText: %{
                  type: "string",
                  description:
                    "Exact text for one targeted replacement. It must be unique in the original file and must not overlap with any other edits[].oldText in the same call."
                },
                newText: %{
                  description:
                    "Replacement text for this targeted edit.",
                  type: "string"
                }
              },
              required: [:oldText, :newText],
              type: "object"
            },
            description:
              "One or more targeted replacements. Each edit is matched against the original file, not incrementally. Do not include overlapping or nested edits. Do not include large unchanged regions just to connect distant changes."
          }
        },
        required: [:path, :edits]
      },
      output_schema: %{
        type: "object",
        properties: %{
          content: %{
            type: "string",
            description: "Edited file contents"
          },
          path: %{
            type: "string",
            description: "File path"
          }
        }
      },
      input_name: "arguments",
      output_name: "result",
      parameters: %{},
      version: "1.0"
    }
  end
