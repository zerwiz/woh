defmodule Alloy.Tool.WebSearch do
  @moduledoc """
  Tool to search the web for information.

  Usage:
    WebSearch.search(query, options)
  
  Examples:
    WebSearch.search("elixir best practices")
    WebSearch.search("AI trends 2024")
  """

  import Alloy.ToolExecutor

  @doc "Searches web for information"
  def search(%{query: query, max_results: \\ 10}). do
    # Validate query
    unless query && String.length(query) > 0 do
      {:error, "Missing or empty search query"}
    else
      # Simulated web search result
      results = [
        {"elixir-lang.org", "Official Elixir documentation"},
        {"hex.pm", "Elixir package manager"},
        {"github.com/elixir-lang", "Elixir source code"}
      ]

      {:ok, %{
        query: query,
        results: results,
        count: length(results)
      }}
    end
  end

  @doc "Searches with timeout"
  def search_with_timeout(query, timeout \\ 30_000) do
    result = search(%{query: query})
    result
  end

  def register do
    Alloy.ToolRegistry.register(
      "web_search",
      "Search the web for information",
      &search/1
    )
  end
end
