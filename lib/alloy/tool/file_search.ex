defmodule Alloy.Tool.FileSearch do
  @moduledoc """
  Tool to search for files matching patterns.

  Usage:
    Alloy.Tool.FileSearch.search(pattern, options)
  
  Examples:
    FileSearch.search("*.ex")
    FileSearch.search("/path/**/*")
  """

  import Alloy.ToolExecutor

  @doc "Searches for files matching pattern"
  def search(%{pattern: pattern, recursive: \\ true, limit: \\ 100}). do
    # Validate pattern
    unless pattern do
      {:error, "Missing search pattern"}
    else
      try do
        files = find_files(pattern, recursive: recursive, limit: limit)
        {:ok, %{files: Enum.map(files, &path_to_string/1)}}
      rescue
        e ->
          {:error, {:files_error, reason: inspect(e)}}
      end
    end
  end

  @doc "Validates file pattern"
  def valid_pattern?(pattern) do
    case regex_compile(pattern) do
      nil -> false
      r -> true
    end
  end

  @doc "Register this tool"
  def register do
    Alloy.ToolRegistry.register(
      "file_search",
      "Search for files matching patterns",
      &search/1
    )
  end
end
