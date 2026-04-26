defmodule AlloyAgent.Definition.Parse do
  @moduledoc """
  Parser for agent definition files.

  Extracts frontmatter and markdown content from .md files.
  Supports YAML-like frontmatter format.
  """

  alias AlloyAgent.Definition

  @frontmatter_pattern ~r/^(---)\s*\n(.+?)\s*\n---/m
  @content_pattern ~r/^(---)\s*\n(.+?)\s*\n---/m

  @doc """
  Parses an agent definition file.

  Extracts frontmatter metadata and markdown content.

  ## Options

  - `:base_dir` - Base directory for relative paths (default: nil)
  - `:validate` - Validate required fields (default: true)

  ## Examples

      iex> AlloyAgent.Definition.Parse.parse(path_to_agent_file)
      %{name: "architect", description: "Architecture agent", ...}

  """
  def parse(content, opts \\ []) do
    validate = Keyword.get(opts, :validate, true)
    base_dir = Keyword.get(opts, :base_dir, nil)

    case extract_frontmatter(content) do
      nil ->
        # No frontmatter, treat as error
        handle_parse_error(content, opts)

      frontmatter ->
        # Extract remaining content
        {:ok, content, remaining} = split_content(content, frontmatter)

        parse_frontmatter(frontmatter, opts)
        |> case do
          {:ok, parsed_headers, metadata} ->
            # Store remaining content in definition
            definition = %Definition{
              headers: parsed_headers,
              value: remaining,
              metadata: metadata
            }

            case validate(definition, base_dir) do
              {:ok, definition} ->
                {:ok, definition}

              error ->
                error
            end

          error ->
            error
        end
    end
  end

  @doc """
  Parses a single agent file from disk.

  ## Examples

      iex> AlloyAgent.Definition.Parse.parse_file("/path/to/agent.md")
      {:ok, definition}

  """
  def parse_file(path, opts \\ []) do
    case File.read(path) do
      {:ok, content} ->
        parse(content, opts)

      error ->
        error
    end
  end

  @doc """
  Extracts frontmatter from markdown content.

  Returns nil if no valid frontmatter found.
  """
  def extract_frontmatter(content) when is_binary(content) do
    content
    |> Regex.run(@frontmatter_pattern)
    |> case do
      [_, raw_frontmatter] ->
        # Extract key-value pairs
        lines = String.split(raw_frontmatter, "\n")
        frontmatter = %MapSet{}

        for line <- lines do
          case parse_frontmatter_line(line) do
            {:ok, key, value} ->
              MapSet.add(frontmatter, {key, value})

            _ ->
              # Skip invalid lines
            end
          end
        end

        frontmatter

      nil ->
        nil
    end
  end

  @doc """
  Parses frontmatter key-value pairs.

  ## Examples

      iex> AlloyAgent.Definition.Parse.parse_frontmatter(":name \"architect\"")
      {:ok, "name", "architect"}

      iex> AlloyAgent.Definition.Parse.parse_frontmatter(":description Architecture agent")
      {:ok, "description", "Architecture agent"}

  """
  def parse_frontmatter_line(line) do
    line = String.trim_leading(line, ":")

    case String.split(line, ~r/\s+(?=[\"\'])/, parts: 2) do
      [key, value] when not is_nil(value) ->
        {:ok, key, value}

      [key] ->
        # Boolean or missing value
        case String.trim_right(String.downcase(key)) do
          "true" ->
            {:ok, key, true}

          "false" ->
            {:ok, key, false}

          _ ->
            {:error, :missing_value}
        end

      _ ->
        {:error, :invalid_format}
    end
  end

  @doc """
  Parses extracted frontmatter map.

  ## Examples

      iex> %MapSet{} = AlloyAgent.Definition.Parse.parse_frontmatter_map(%MapSet{{"name" => "architect", "description": "Architecture agent"}})
      %{name: "architect", description: "Architecture agent"}

  """
  def parse_frontmatter_map(maps) do
    Map.new(maps, fn {key, value} ->
      {key, to_string(value)}
    end)
  end

  def parse_frontmatter_map(nil) do
    nil
  end

  @doc """
  Parses frontmatter headers (name, description, tools, etc.).

  Extracts headers section and remaining content.
  """
  def parse_frontmatter(maps, _opts) do
    headers = maps[:headers] || []
    value = maps[:value] || ""
    metadata = parse_frontmatter_map(maps)

    {:ok, headers, metadata}
  end

  @doc """
  Splits content at frontmatter boundary.

  Returns remaining content after frontmatter.
  """
  def split_content(content, raw_frontmatter) do
    case Regex.run(@content_pattern, content, \\1) do
      [_, before] ->
        # Find the second --- that comes after first ---
        after_frontmatter = content |> String.contains?(raw_frontmatter) |> then(fn true ->
          # Extract everything after the frontmatter block
          raw_frontmatter = raw_frontmatter <> " \n"
          String.split_after(content, raw_frontmatter) |> then(fn [_, rest] ->
            rest
          end)

          # Actually, let's use String.split_after with pattern
          frontmatter_end_pos = String.length(raw_frontmatter)
          String.slice(content, frontmatter_end_pos + 1, string_size(content) - frontmatter_end_pos)
        end)

        {:ok, before, after_frontmatter}

      nil ->
        # No frontmatter found, entire content is value
        {:ok, nil, content}
    end
  end

  @doc """
  Validates a parsed definition.

  Ensures all required fields are present.
  """
  def validate(definition, base_dir) do
    required_fields = [:name]

    missing_fields = required_fields |> Enum.reject(fn field ->
      definition |> Map.get(field) |> case do
        nil -> false
        val -> not (val == "")
      end
    end)

    unless Enum.empty?(missing_fields) do
      return
    end

    # Validate tools if specified
    tools = definition[:tools] || []

    case Enum.map(tools, &String.trim/1) do
      [] ->
        {:ok, definition}

      _ ->
        # Check if tools exist in registry
        registry_info = Enum.map(tools, fn tool ->
          Registry.lookup(tool)
        end)

        # Build validation errors
        errors = []

        for tool_info <- Enum.zip_with(tools, registry_info, &(&1 != nil)) do
          when not is_nil(tool_info), do: next

          # tool_info is {:ok, %{name: tool_name}|, tool_name, %{}|}
        end

        {:error, "Invalid tools"}
      end)

    # Check if description and system_prompt are provided
    description = definition[:description] || ""

    unless String.trim(description) do
      :error
    end
  end

  @doc """
  Handles parse error.
  """
  def handle_parse_error(_content, _opts) do
    {:error, "Failed to parse agent definition file"}
  end
end
