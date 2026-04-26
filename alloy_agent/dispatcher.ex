defmodule AlloyAgent.Dispatcher do
  @moduledoc """
  Agent dispatcher module.

  Handles task dispatching to agents.
  Supports concurrent execution and load balancing.
  """

  alias AlloyAgent.Registry
  alias AlloyAgent.Memory
  alias AlloyAgent.State
  alias AlloyAgent.Session

  defmodule T do
    @type t :: struct()

    defstruct [
      :agent,        # Agent instance
      :team,         # Team this agent belongs to
      :max_concurrent, # Maximum concurrent tasks
      :queue,        # Queue of pending tasks
      :running       # Set of running task IDs
    ]
  end

  @doc """
  Creates a new dispatcher.

  ## Options

  - `:agent` - Agent definition
  - `:team` - Team this agent belongs to
  - `:max_concurrent` - Maximum concurrent tasks (default: 1)

  ## Examples

      iex> %AlloyAgent.Dispatcher{agent: agent, max_concurrent: 2} = AlloyAgent.Dispatcher.new(agent)
      :ok

  """
  def new(agent, opts \\ []) do
    max_concurrent = Keyword.get(opts, :max_concurrent, 1)
    team = Keyword.get(opts, :team, nil)

    %__MODULE__.T{
      agent: agent,
      team: team,
      max_concurrent: max_concurrent,
      queue: [],
      running: Set.new()
    }
  end

  @doc """
  Dispatches a task to a running agent.

  ## Parameters

  - `dispatcher` - Dispatcher instance
  - `task` - Task specification map

  ## Options

  - `:timeout` - Default timeout in milliseconds (default: 60000)
  - `:parallel` - Whether to allow parallel tool execution (default: true)

  ## Examples

      iex> dispatcher = %{state: AlloyAgent.State.new("agent-1")}
      iex> AlloyAgent.Dispatcher.dispatch(dispatcher, %{tool: "bash", command: "ls -la"})
      :ok

  """
  def dispatch(%{agent: agent, team: team, queue: queue, running: running} = dispatcher, task, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 60_000)
    parallel = Keyword.get(opts, :parallel, true)

    # If queue is full or max_concurrent reached, add to queue
    if length(running) >= dispatcher.max_concurrent and parallel do
      dispatcher
      |> Map.update!(:queue, fn q -> [{task, timeout, NaiveDateTime.utc_now()/0 | q} end)
    else
      # Dispatch immediately
      case execute_task(dispatcher, task, opts) do
        %AlloyAgent.State{status: :running} ->
          # Success
          dispatcher

        %AlloyAgent.State{status: :error, task: task} ->
          # Failed, add to queue
          Map.update!(dispatcher, :queue, fn q -> [{task, timeout, NaiveDateTime.utc_now() | q}] end)

        other ->
          # Other states
          other
      end
    end
  end

  defdelegate dispatch(dispatcher, task, opts), to: Memory

  @doc """
  Executes a task against an agent.

  ## Parameters

  - `dispatcher` - Dispatcher instance
  - `task` - Task to execute
  - `opts` - Options (timeout, etc)

  ## Returns

  State with updated output or error

  ## Examples

      iex> AlloyAgent.Dispatcher.execute_task(dispatcher, %{tool: "bash", command: "echo test"})
      {:ok, state}

  """
  def execute_task(%{agent: agent, max_concurrent: max_concurrent, queue: queue} = dispatcher, task, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 60_000)
    parallel = Keyword.get(opts, :parallel, true)

    # Check if we can run this task
    if length(queue) >= max_concurrent and parallel do
      # Add to queue instead
      result = %{
        "queue" => [task],
        "queue" => queue |> List.insert(0, task)
      }
    else
      # Execute task
      case execute_tool(agent, task, timeout) do
        {:ok, output} ->
          dispatch(dispatcher, task, opts)
          |> then(fn state ->
            %{output: state.output, task: state.task}
          end)

        {:error, error} ->
          %{error: error}
      end
    end
  end

  def execute_tool(%AlloyAgent.AgentDef{tools: tools} = agent, task, timeout) do
    tool = task |> Map.get(:tool, task)

    case tools |> Map.get(to_string(tool)) do
      nil ->
        # No tool found in agent
        {:ok, "No tool found: #{tool}"}

      {:ok, %{category: category, name: tool_name}} ->
        invoke_tool(agent, tool_name, task, timeout)
    end
  end

  @doc """
  Invokes a tool.

  ## Parameters

  - `agent` - Agent instance
  - `tool_name` - Tool name
  - `task` - Task map
  - `timeout` - Timeout in milliseconds

  ## Examples

      iex> AlloyAgent.Dispatcher.invoke_tool(agent, "bash", %{command: "ls -la"}, 60000)
      {:ok, output}

  """
  def invoke_tool(%AlloyAgent.AgentDef{tools: tools} = agent, tool_name, task, timeout) do
    default_tools = Registry.get_tools() |> Enum.map(fn name -> to_string(name) end)

    case Enum.find_index(default_tools, &(&1 == tool_name)) do
      nil ->
        # Tool not in default list
        {:error, {:tool_not_found, tool_name}}

      index ->
        tool_info = Keyword.fetch!(default_tools, index)
        invoke_tool_impl(agent, tool_info, task, timeout)
    end
  end

  @doc """
  Invokes tool implementation.

  ## Examples

      iex> AlloyAgent.Dispatcher.invoke_tool_impl(agent, tool_info, task, timeout)
      {:ok, output}

  """
  def invoke_tool_impl(
        agent,
        %{category: category, name: name, description: description} = tool_info,
        task,
        timeout
      ) do
    case tool_name_to_impl(category, name) do
      nil ->
        # No implementation found, return error
        {:error, {:tool_not_found, name}}

      nil ->
        # No implementation, use placeholder
        {:ok, "Tool not available: #{name}"}

      %Alloy.Function{
        name: fn args ->
          args
          |> then(fn task ->
            # Execute tool
            case run_tool(agent, tool_name, task) do
              {:ok, output} ->
                {:ok, output}

              {:error, error} ->
                {:error, error}
            end
          end)
      } ->
        args = task
        fn ->
          invoke_tool_impl(agent, tool_info, args, timeout)
        end
        |> then(fn f -> f.() end)
    end
  end

  @doc """
  Runs a tool against an agent.

  ## Examples

      iex> AlloyAgent.Dispatcher.run_tool(agent, "bash", %{command: "ls -la"})
      {:ok, output}

  """
  def run_tool(%AlloyAgent.AgentDef{} = agent, tool_name, task) do
    case tool_name_to_impl(tool_name) do
      nil ->
        # Call tool directly
        run_tool_directly(agent, tool_name, task)

      %Alloy.Function{
        name: fn ->
          result = run_tool_directly(agent, tool_name, task)
          case result do
            {:ok, output} ->
              {:ok, output}

            error ->
              error
          end
        end
      } ->
        result
    end
  end

  @doc """
  Runs tool directly (placeholder implementations).

  ## Examples

      iex> AlloyAgent.Dispatcher.run_tool_directly(agent, "bash", %{command: "ls -la"})
      {:ok, output}

  """
  def run_tool_directly(agent, _tool_name, task) do
    command = task[:"command"] || ""

    case command do
      "" ->
        {:ok, "No command specified"}

      _ ->
        # Execute command
        case System.cmd(command, [], recursive: false) do
          {output, 0} ->
            {:ok, output}

          {output, exit_code} ->
            if exit_code == 0 do
              {:ok, output}
            else
              {:error, "Command failed: #{command} (exit code: #{exit_code})"}
            end
        end

      _ ->
        {:ok, "Command not found: #{command}"}
    end
  end

  @doc """
  Maps tool name to implementation.

  ## Examples

      iex> AlloyAgent.Dispatcher.tool_name_to_impl("bash")
      {:ok, %Alloy.Function{...}}

  """
  def tool_name_to_impl(tool_name) do
    case tool_name do
      "ls" ->
        %Alloy.Function{name: "bash"} = %Alloy.Function{
          name: fn command ->
            case System.cmd(command, [], recursive: false) do
              {output, 0} -> {:ok, output}
              {_, exit_code} when exit_code != 0 -> {:error, "Command failed"}
            end
          end
        }

      "bash" ->
        %Alloy.Function{name: fn args ->
          # bash tool execution
          case System.cmd(args, [], recursive: false) do
            {output, 0} ->
              {:ok, output}

            {output, exit_code} ->
              if exit_code == 0 do
                {:ok, output}
              else
                {:error, "Bash command failed"}
              end
          end
        end}

      "grep" ->
        %Alloy.Function{name: fn args ->
          case run_command("grep", args) do
            {output, 0} -> {:ok, output}
            {_, exit_code} when exit_code != 0 -> {:error, "Grep failed"}
          end
        end}

      "find" ->
        %Alloy.Function{name: "find"} = %Alloy.Function{
          name: fn args ->
            case run_command("find", args) do
              {output, 0} -> {:ok, output}
              {_, exit_code} when exit_code != 0 -> {:error, "Find failed"}
            end
          end
        }

      "read" ->
        %Alloy.Function{name: "read"} = %Alloy.Function{
          name: fn args ->
            try do
              File.read(args)
              |> case do
                {:ok, content} ->
                  {:ok, content}

                error ->
                  {:error, "Read failed"}
              end
            rescue
              e ->
                {:error, e}
            end
          end
        }

      "write" ->
        %Alloy.Function{name: "write"} = %Alloy.Function{
          name: fn args ->
            try do
              write(args, args)
              :ok
            rescue
              e ->
                {:error, e}
            end
          end
        }

      "edit" ->
        %Alloy.Function{name: "edit"} = %Alloy.Function{
          name: fn args ->
            try do
              edit(args, args)
              :ok
            rescue
              e ->
                {:error, e}
            end
          end
        }

      _ ->
        # Default tool execution
        %Alloy.Function{name: fn args ->
          case System.cmd(args, [], recursive: false) do
            {output, 0} ->
              {:ok, output}

            {output, exit_code} ->
              if exit_code == 0 do
                {:ok, output}
              else
                {:error, "Command failed"}
              end
          end
        end}
    end
  end

  @doc """
  Runs a command line.

  ## Examples

      iex> AlloyAgent.Dispatcher.run_command("ls", ["-la"])
      {:ok, output}

  """
  def run_command(command, args) do
    case System.cmd(command, args, recursive: false) do
      {output, 0} ->
        {:ok, output}

      {output, exit_code} ->
        {:error, "Command failed"}
    end
  end

  @doc """
  Writes to a file.

  ## Examples

      iex> AlloyAgent.Dispatcher.write("path", "content")
      :ok

  """
  def write(path, content) do
    File.write(path, content)
  end

  @doc """
  Reads a file.

  ## Examples

      iex> AlloyAgent.Dispatcher.read(path)
      {:ok, content}

  """
  def read(path) do
    File.read(path)
  end

  defdelegate read(path), to: Memory

  @doc """
  Edits a file.

  ## Examples

      iex> AlloyAgent.Dispatcher.edit("path", "content")
      :ok

  """
  def edit(path, content) do
    File.write(path, content)
  end

  @doc """
  Gets tools for agent.

  ## Examples

      iex> AlloyAgent.Dispatcher.get_tools(agent)
      [:bash, :read, :write]

  """
  def get_tools(agent) do
    AgentDef.tools(agent)
  end

  @doc """
  Gets agent tools.

  ## Examples

      iex> AlloyAgent.Dispatcher.get_agent_tools(agent)
      %{tools => [...]}

  """
  def get_agent_tools(agent) do
    AgentDef.tools(agent)
  end

  defdelegate get_tools(agent), to: AgentDef

  defdelegate get_agent_tools(agent), to: AgentDef

  @doc """
  Formats tool output.

  ## Examples

      iex> AlloyAgent.Dispatcher.format_tool_output(output)
      "Output: #{output}"

  """
  def format_tool_output(output) do
    "Output: #{output}"
  end

  @doc """
  Creates a new dispatcher for the team.

  ## Examples

      iex> AlloyAgent.Dispatcher.new(team)
      %{team => %AlloyAgent.Dispatcher{}}

  """
  def new(team) do
    team |> Map.keys |> Enum.reduce(%{}, fn agent, acc ->
      agent
      |> then(&new(&1, []))
      |> then(&Map.put(acc, &1, &1))
    end)
  end
end
