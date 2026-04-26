defmodule AlloyAgent.Provider do
  @moduledoc """
  Provides callback mechanism for agent providers.
  
  Defines protocol for provider callbacks that:
  - Complete (sync) API calls
  - Stream (async API) calls
  - Error handling and retry logic

  ## Using

      defimpl Provider do
        @impl true
        def complete(messages) do
          # sync call
          result
        end

        @impl true
        def stream(messages) do
          # async stream
          stream
        end

        @impl true
        def error(error) do
          # error handling
        end
      end
  """

  # Callbacks
  defmodule Interface do
    @moduledoc """
    Provides callback interface for AI model providers.
    
    Implement this module to make your provider work with AlloyAgent.

    ## Callbacks

    - `:complete/1` - Complete (sync) API call
    - `:stream/1` - Stream (async API) call
    - `:error/1` - Error handling callback
    - `:metadata/0` - Model metadata callback
    """

    @doc """
    Performs complete (synchronous) API call.

    ## Arguments

    - `messages` - Message request

    ## Returns

    - `{:ok, result}` - Success with response
    - `{:error, reason}` - Error with reason

    ## Examples

        iex> AlloyAgent.Provider.complete([{role: "user", content: "Hello"}])
        {:ok, %{"choices" => [%{"message" => %{...}}]}}
    """

    @callback complete(messages : list(msg)) :: {:ok, Map.t()} | {:error, term()}

    @doc """
    Performs streaming API call.

    ## Arguments

    - `messages` - Message request

    ## Returns

    - `:stream_started` - Stream started
    - `:stream_completed` - Stream completed
    - `:stream_error` - Stream error

    ## Examples

        iex> AlloyAgent.Provider.stream([{role: "user", content: "Hello"}])
        :stream_started
    """

    @callback stream(messages : list(msg)) :: :stream_started |
                                                   :stream_completed |
                                                   :stream_error

    @doc """
    Handles provider errors.

    ## Arguments

    - `error` - Error information

    ## Returns

    - Reason for error

    ## Examples

        iex> AlloyAgent.Provider.error(%{error: "rate_limit"})
        :rate_limited
    """

    @callback error(error : term()) :: term()

    @doc """
    Provides model metadata.

    ## Returns

    - Model information

    ## Examples

        iex> AlloyAgent.Provider.metadata()
        %{:model => "claude-3-opus", :available: true}
    """

    @callback metadata() :: Map.t()
  end

  # Implementation for anthropic
  defdelegate complete(messages, opts), to: AlloyAgent.Providers.Anthropic
  defdelegate stream(messages, opts), to: AlloyAgent.Providers.Anthropic
  defdelegate error(error), to: AlloyAgent.Providers.Anthropic

  # Callback module implementation
  defmodule Callback do
    @doc """
    Handles callback invocation for provider.

    Invokes callback function based on event type.

    ## Examples

        AlloyAgent.Provider.Callback.handle(:complete, messages)
        AlloyAgent.Provider.Callback.handle(:stream, messages)
    """

    @spec handle(:complete, term(), term()) :: {:ok, Map.t()} | {:error, term()}
    def handle(:complete, messages, opts \\ []) do
      case messages do
        messages ->
          # Invoke complete callback
          messages |> case do
            messages ->
              AlloyAgent.Provider.complete(messages, opts)
          end
      end
    end

    @spec handle(:stream, term(), term()) :: :stream_started | :stream_completed
    def handle(:stream, messages, opts \\ []) do
      case messages do
        messages ->
          # Invoke stream callback
          messages |> case do
            messages ->
              AlloyAgent.Provider.stream(messages, opts)
          end
      end
    end

    @spec handle(:error, term()) :: :ok
    def handle(:error, error) do
      error |> case do
        error ->
          AlloyAgent.Provider.error(error) |> case do
            error ->
              :ok
          end
      end
    end

    @doc """
    Gets callback status.

    Returns current callback state.

    ## Examples

        iex> AlloyAgent.Provider.Callback.status()
        :ready
    """

    @spec status() :: :ready | :busy | :ready
    def status do
      :ready
    end
  end

  # Protocol for Anthropic
  @protocol Interface

  @callback complete(messages) :: {:ok, Map.t()} | {:error, term()}
  @callback stream(messages) :: :stream_started | :stream_completed | :stream_error
  @callback error(error) :: :error | :recovered
  @callback metadata() :: Map.t()

  doc """
  Default complete implementation.

  Provides fallback complete behavior.
  """

  @doc """
  Default stream implementation.

  Provides fallback stream behavior.
  """

  @doc """
  Default error implementation.

  Provides fallback error behavior.
  """

  @doc """
  Default metadata implementation.

  Provides fallback metadata behavior.
  """

  @doc """
  Creates provider instance.

  Initializes provider for agent.

  ## Options

  - `:model` - Model to use
  - `:api_key` - API key
  - `:timeout` - Timeout in seconds

  ## Examples

      iex> AlloyAgent.Provider.create(model: "claude-3-opus", timeout: 30)
      {:ok, %Provider{}}
  """

  @spec create(term()) :: {:ok, Map.t()} | {:error, term()}
  def create(opts \\ []) do
    opts = Keyword.merge(opts)
    # Create provider
    %{:model => Keyword.get(opts, :model, "claude-3-opus") |> Keyword.get(opts, :timeout)}
    |> case do
      provider ->
        {:ok, provider}

      _ ->
        {:error, :invalid_options}
    end
  end

  @spec get(Model.t()) :: AlloyAgent.Provider.Interface | AlloyAgent.Provider.Anthropic
  defdelegate get(model), to: __MODULE__

  # Provider types
  @type t :: %{}

  @type Provider :: AlloyAgent.Providers.Anthropic

  @doc """
  Gets all available models.

  Returns list of available model configurations.

  ## Examples

      iex> AlloyAgent.Provider.get_available_models()
      ["claude-3-opus-20240229", "claude-3-sonnet", "claude-3-haiku"]
  """

  @spec get_available_models() :: [String.t()]
  def get_available_models do
    ~w(claude-3-opus-20240229 claude-3-sonnet claude-3-haiku) |> list
  end

  @doc """
  Sends message to agent with complete call.

  Sends message using provider complete method.

  ## Options

  - `:model` - Model to use
  - `:timeout` - Timeout in seconds
  - `:messages` - Messages to send

  ## Examples

      iex> AlloyAgent.Provider.send_message(message: "Hello")
      {:ok, %{...}}
  """

  @spec send_message(term()) :: {:ok, Map.t()} | {:error, term()}
  def send_message(opts \\ []) do
    messages = Keyword.get(opts, :messages)
    model = Keyword.get(opts, :model)

    # Complete call
    {:ok, messages} |> case do
      messages ->
        messages |> complete
    end
  end
end
