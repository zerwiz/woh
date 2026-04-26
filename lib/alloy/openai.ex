defmodule AlloyAgent.Providers.OpenAI do
  @moduledoc false
  use AlloyAgent.Provider

  defstruct [:api_key, :base_url]

  alias {AlloyAgent.Providers.OpenAI, OpenAI}

  def complete(%OpenAI{api_key: api_key, base_url: base_url}, message_or_messages, opts) do
    {:ok, "OpenAI response", opts, %OpenAI{api_key: api_key}}
  end

  def stream(%OpenAI{api_key: api_key, base_url: base_url}, message_or_messages, opts, _on_chunk) do
    pid = spawn_link(fn ->
      # Stream implementation
      sleep(1)
    end)
    {:ok, pid}
  end
end
