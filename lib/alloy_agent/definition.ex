defmodule AlloyAgent.Definition do
  @moduledoc """
  Agent definition module for parsing agent definitions.

  Handles frontmatter extraction and agent struct creation.
  """

  alias AlloyAgent.Definition

  @doc "Parses agent definition from markdown text"
  def parse_agent_text(text) do
    frontmatter = extract_frontmatter(text)
    content = extract_content(text)

    %Definition.T{
      name: frontmatter[:name],
      description: frontmatter[:description],
      tools: frontmatter[:tools] || [],
      system_prompt: frontmatter[:system_prompt] || "",
      value: content,
      metadata: frontmatter[:meta] || %{},
      file_path: nil
    }
  end

  @doc "Parse agent definition from file"
  def parse_agent_file(file_path) do
    text = File.read(file_path)
    case text do
      {:ok, content} ->
        parse_agent_text(content)

      error ->
        error
    end
  end

  @doc "Extract frontmatter from markdown text"
  defp extract_frontmatter(markdown) do
    if String.starts_with?(markdown, "---\n") do
      frontmatter_end = String.contains?(markdown, "\n---\n")
        && String.grapheme_width(markdown, String.length(markdown) - 3 - 1)
        || markdown |> String.split_at(String.length(markdown) - 3) |> elem(0) |> String.rindex("\n") |> &String.prev_binary(&1, 1)

      frontmatter_text = case frontmatter_end do
        nil ->
          markdown |> String.split_at(3) |> elem(1)

        frontmatter_end_index ->
          markdown |> String.slice(3..frontmatter_end_index)
      end

      frontmatter_text |> parse_frontmatter
    else
      %{}
    end
  end

  @doc "Extract content from markdown text"
  defp extract_content(markdown) do
    case find_frontmatter_end(markdown) do
      nil ->
        markdown

      end_index ->
        markdown |> String.slice(end_index + 3..-1)
    end
  end

  @doc "Parse frontmatter text"
  defp parse_frontmatter(text) do
    case text do
      "" ->
        %{}

      _ ->
        text
        |> String.trim()
        |> String.split("\n")
        |> Enum.reduce(%{}, fn line, acc ->
          case Regex.run(~r/^\s*(?<key>[a-zA-Z0-9_]+):\s*(?<value>.*)$/, line) do
            [_, key: key, value: value] ->
              key = String.trim(key)

              case parse_value(value) do
                {:ok, parsed} ->
                  Map.put(acc, key, parsed)

                error ->
                  acc
              end

            _ ->
              acc
          end

          nil ->
            acc
        end)
    end
  end

  @doc "Parse frontmatter value"
  defp parse_value(value) do
    value = String.trim(value)

    case Regex.run(~r/^['"](.+)['"]$/, value) do
      [_, value] ->
        {:ok, value}

      _ ->
        value = String.replace(value, ~r/"/, '', global: true)
        {:ok, value}
    end
  end

  @doc "Find frontmatter end in markdown"
  defp find_frontmatter_end(markdown) do
    index = String.rindex(markdown, "\n---\n")

    case index do
      nil ->
        nil

      index ->
        index
    end
  end

  defmodule T do
    @type t :: %Definition.T{
      name: String.t() || nil,
      description: String.t() || nil,
      tools: list(String.t()) || [],
      system_prompt: String.t() || "",
      value: String.t() || "",
      metadata: map() || %{},
      file_path: Path.t() || nil
    }

    defstruct [:name, :description, :tools, :system_prompt, :file_path,
               :team, :metadata, :value]
  end
end