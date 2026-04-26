defmodule AlloyAgent.Providers.Anthropic do
  @moduledoc """
  Anthropic Claude API provider for agent.
  
  Handles complete (sync) and streaming (SSE) API calls
  with response parsing and error handling.

  ## Configuration

  Requires :alloy configuration with:
  - :api_key - Anthropic API key
  - :api_url - Anthropic API endpoint
  - :model - Model to use
  """

  require Logger

  @api_url :system_config.fetch(:anthropic_url, "https://api.anthropic.com")
  @api_key :system_config.fetch(:anthropic_key)
  @version "2023-06-01"

  @doc """
  Makes complete API call to Anthropic Claude.

  Executes synchronous API call and parses response.

  ## Options

  - `:messages` - List of messages to process
  - `:model` - Model to use (default: "claude-3-opus-20240229")
  - `:temperature` - Sampling temperature (default: 1.0)
  - `:max_tokens` - Maximum tokens to generate (default: 1024)
  - `:system` - System prompt
  - `:system_prompt` - Alternative system prompt

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.complete([{role: "user", content: "Hello"}])
      {:ok, %{content: "response content"}}

  """

  @spec complete(term(), term()) :: {:ok, Map.t()} | {:error, atom()}
  def complete(messages, opts \\ []) do
    opts = Keyword.merge(opts, messages: messages)
    messages = Keyword.get(opts, :messages)

    model = Keyword.get(opts, :model, "claude-3-opus-20240229")
    temperature = Keyword.get(opts, :temperature, 1.0)
    max_tokens = Keyword.get(opts, :max_tokens, 1024)
    system_prompt = Keyword.get(opts, :system_prompt, nil)

    # Prepare request payload
    request = %{
      model: model,
      max_tokens: max_tokens,
      messages: messages,
      temperature: temperature,
      system: system_prompt,
      version: @version
    }

    # Send request
    case http_post(@api_url <> "/v1/messages", request) do
      {:ok, response} ->
        # Parse response
        case parse_response(response) do
          {:ok, result} ->
            {:ok, result}

          error ->
            error
        end

      error ->
        error
    end
  end

  @doc """
  Makes streaming API call to Anthropic Claude.

  Executes streaming API call with SSE handling.

  ## Options

  - `:messages` - List of messages to process
  - `:model` - Model to use (default: "claude-3-opus-20240229")
  - `:temperature` - Sampling temperature (default: 1.0)
  - `:max_tokens` - Maximum tokens to generate (default: 1024)
  - `:system` - System prompt
  - `:system_prompt` - Alternative system prompt
  - `:stream_callback` - Elixir function to handle stream events

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.stream([{role: "user", content: "Hello"}])
      :stream_started

  """

  @spec stream(term(), term()) :: :stream_started | :stream_completed
  def stream(messages, opts \\ []) do
    opts = Keyword.merge(opts, messages: messages)
    messages = Keyword.get(opts, :messages)

    model = Keyword.get(opts, :model, "claude-3-opus-20240229")
    temperature = Keyword.get(opts, :temperature, 1.0)
    max_tokens = Keyword.get(opts, :max_tokens, 1024)
    system_prompt = Keyword.get(opts, :system_prompt, nil)

    # Prepare request payload
    request = %{
      model: model,
      max_tokens: max_tokens,
      messages: messages,
      temperature: temperature,
      stream: true,
      system: system_prompt,
      version: @version
    }

    # Send streaming request
    case http_post(@api_url <> "/v1/messages", request, stream: true) do
      {:ok, stream_response} ->
        # Handle stream response
        handle_stream(stream_response)

      error ->
        error
    end
  end

  @doc """
  Parses API response.

  Extracts message content and metadata from response.

  ## Parameters

  - `response` - API response body

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.parse_response(%{"content" => ["Hello"]})
      {:ok, %{content: "Hello", ...}}

  """

  @spec parse_response(Map.t()) :: {:ok, Map.t()} | {:error, atom()}
  def parse_response(response) do
    response |> case do
      %{"type" => "message", "content" => contents} ->
        # Extract message content
        messages =
          contents |> Enum.reverse |> Enum.map(fn content ->
            %{:content => content, :role => response["role"]}
          end)

        # Build result
        result = %{
          content: to_string(contents |> Enum.map(&&1.content) |> Enum.join()),
          output: to_string(contents |> Enum.map(fn content -> content.content end) |> Enum.join("\n")),
          usage: response["usage"] || %{:prompt_tokens => 0, :completion_tokens => 0},
          stop_reason: response["stop_reason"] |> to_string,
          id: response["id"] |> to_string
        }

        {:ok, result}

      %{"error" => error} ->
        {:error, error}

      _ ->
        {:error, :invalid_response}
    end
  end

  @doc """
  Handles streaming response.

  Processes SSE stream events and builds complete message.

  ## Parameters

  - `stream_response` - Stream response body

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.handle_stream(%{events: [%{"type" => "content_block_delta"}]})
      :stream_started

  """

  @spec handle_stream(Map.t()) :: :stream_started | :stream_completed | :stream_error
  def handle_stream(stream_response) do
    {:ok, stream_response} |> case do
      {:ok, %{"type" => "stream", "value" => %{"type" => "stream"}}} ->
        :stream_started

      {:ok, %{"type" => "message_start"}} ->
        # Parse message start
        case parse_message_start(stream_response) do
          {:ok, start_info} ->
            :stream_started

          error ->
            error
        end

      {:ok, %{"type" => "message_delta"}} ->
        # Parse delta
        case parse_message_delta(stream_response) do
          {:ok, delta} ->
            delta

          error ->
            error
        end

      {:ok, %{"type" => "message_end"}} ->
        :stream_completed

      {:ok, %{"type" => "content_block_start"}} ->
        :stream_started

      {:ok, %{"type" => "content_block_delta"}} ->
        :stream_started

      {:ok, %{"type" => "content_block_stop"}} ->
        :stream_completed

      _ ->
        :stream_started
    end
  end

  @doc """
  Sends HTTP POST request.

  Connects and sends to Anthropic API URL.

  ## Options

  - `:headers` - Headers to include
  - `:stream` - Enable streaming (default: false)

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.http_post("https://api.example.com/v1/messages")
      {:ok, result}

  """

  @spec http_post(String.t(), Map.t(), term()) :: {:ok, Map.t()} | {:error, atom()}
  def http_post(url, body, opts \\ []) do
    # Default headers
    headers = %{
      "Content-Type" => "application/json",
      "x-api-key" => @api_key
    }

    opts = Keyword.merge(opts, headers: headers)
    headers = Keyword.get(opts, :headers, headers)

    # Build request body
    request_body =
      body |> URI.encode_query(body) |> Base.encode64(body) |> Base.decode64(body)

    # Send request using :httpc
    client = httpc(:client)
    client = httpc.start_link(client, opts)

    # Execute request
    case httpc.request(client, url, %{method: "post"}, body) do
      {:ok, %{"status_code" => 200, "headers" => headers, "body" => body}} ->
        {:ok, %{headers: headers, body: body}}

      {:error, error} ->
        error
    end
  end

  @doc """
  Creates HTTP client.

  Initializes HTTP client for API calls.

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.httpc_init()
      :ok

  """

  @spec httpc_init() :: :ok
  def httpc_init do
    httpc.start_link(%{})
  end

  @doc """
  Gets model information.

  Retrieves information about available models.

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.get_model_info("claude-3-opus-20240229")
      %{name: "claude-3-opus-20240229", available: true}

  """

  @spec get_model_info(String.t()) :: Map.t()
  def get_model_info(model) do
    case model do
      "claude-3-opus-20240229" ->
        %{:name => "claude-3-opus", :version => "20240229", :available: true}

      "claude-3-sonnet" ->
        %{:name => "claude-3-sonnet", :available: true}

      "claude-3-haiku" ->
        %{:name => "claude-3-haiku", :available: true}

      "claude-2.1" ->
        %{:name => "claude-2.1", :available: false}

      "claude-2" ->
        %{:name => "claude-2", :available: false}

      _ ->
        %{:name => model, :available: false}
    end
  end

  @doc """
  Checks API availability.

  Tests connection to Anthropic API.

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.check_connection()
      :connected

  """

  @spec check_connection() :: :connected | :disconnected | :error
  def check_connection do
    case http_post(@api_url <> "/v1/messages", %{}) do
      {:ok, _} ->
        :connected

      error ->
        error
    end
  end

  @doc """
  Sends system prompt.

  Configures system message for agent.

  ## Options

  - `:prompt` - System prompt text
  - `:override` - Override current system prompt (default: true)

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.set_system_prompt("You are a helpful assistant")
      :ok

  """

  @spec set_system_prompt(String.t()) :: :ok | {:error, atom()}
  def set_system_prompt(prompt, opts \\ []) do
    prompt = Keyword.get(opts, :prompt, prompt)
    override = Keyword.get(opts, :override, true)

    override = if override do
      prompt |> prompt |> System.config(:anthropic_system_prompt, prompt)

      :ok
    else
      :pending
    end

    :ok
  end

  @doc """
  Gets current system prompt.

  Retrieves configured system prompt.

  ## Examples

      iex> AlloyAgent.Providers.Anthropic.get_system_prompt()
      "You are a helpful assistant"

  """

  @spec get_system_prompt() :: String.t() | nil
  def get_system_prompt do
    System.config(:anthropic_system_prompt)
  end

  defdelegate set_system_prompt(prompt, opts), to: __MODULE__
  defdelegate get_system_prompt(), to: __MODULE__
end
