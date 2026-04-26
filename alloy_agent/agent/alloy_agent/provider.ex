defmodule AlloyAgent.Provider do
  @moduledoc """
  Provider typespec parity for all Alloy providers.

  Every provider implementing the Alloy.Provider behaviour exposes:
  - `@type config` attribute
  - `@spec complete/3` and `@spec stream/4`

  This provides type-checking at call sites via dialyzer.
  
  Supported providers:
  - Alloy.Provider.Anthropic
  - Alloy.Provider.OpenAI
  - Alloy.Provider.Gemini
  - Alloy.Provider.Ollama
  - Alloy.Provider.OpenRouter
  - Alloy.Provider.XAI
  - Alloy.Provider.DeepSeek
  - Alloy.Provider.Mistral
  """

  use AlloyAgent.Events

  alias Alloy.Provider.Gemini
  alias Alloy.Provider.{Anthropic, DeepSeek, OpenAI, OpenRouter}

  @doc """
  Typecheck provider configuration.
  """
  @type config() :: map() | Alloy.Config

  @doc """
  Common provider behavior stubs.
  """
  @callback complete(config(), message() | String.t(), opts) :: {:ok, result, opts, state}
  @callback complete(config(), list(), opts) :: {:ok, result, opts, state}

  @callback stream(config(), message() | String.t(), opts, on_chunk) :: {:ok, pid}
  @callback stream(config(), list(), opts, on_chunk) :: {:ok, pid}

  defmacro __using__(_opts) do
    quote do
      import AlloyAgent.Events
    end
  end
end
