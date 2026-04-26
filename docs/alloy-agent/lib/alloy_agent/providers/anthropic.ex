defmodule AlloyAgent.Providers.Anthropic do
  @moduledoc false
  use AlloyAgent.Provider

  defstruct [:api_key]

  @type config() :: %{
          api_key: String.t(),
          model: String.t()
        }

  alias {AlloyAgent.Providers.Anthropic, Anthropic}

  alias NimbleParsec

  def complete(%Anthropic{api_key: api_key, model: model}, message_or_messages, opts) do
    # Implementation stub
    {:ok, "Anthropic response", opts, %Anthropic{api_key: api_key}}
  end

  def stream(%Anthropic{api_key: api_key, model: model}, message_or_messages, opts, _on_chunk) do
    # Implementation stub
    pid = spawn_link(fn ->
      # Stream implementation
      sleep(1)
    end)
    {:ok, pid}
  end
end
